import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";
import { mayus } from "../utils/text.utils.js";
import { manejarCambioEstadoPedido } from "./pedido.repository.js";

const TABLE = "itemPedido";

// Fotos del ítem (para la vista de "Mis ítems" del empleado, que las
// muestra en la tarjeta con ampliar/lightbox) -- se traen ya agregadas acá
// para no tener que hacer una consulta aparte por cada ítem.
const FOTOS_ITEM = `(
  SELECT COALESCE(
    json_agg(json_build_object('idImagen', img."idImagen", 'rutaImagen', img."rutaImagen") ORDER BY img."idImagen"),
    '[]'
  )
  FROM imagenes img
  WHERE img."tipoReferencia" = 'itemPedido' AND img."idReferencia" = "${TABLE}"."idItemPedido"
) as "fotos"`;

// Número de ítem DENTRO de su propio pedido (1, 2, 3...) -- lo que ya se ve
// en el detalle del pedido ("Ítem #1", "Ítem #2", calculado ahí como
// posición en el arreglo, ordenado por fechaEntrega/idItemPedido igual que
// getItemsPedido() sin idEmpleado). Se expone acá para que "Mis ítems" e
// "Ítems" (admin) muestren el MISMO número que el detalle del pedido, en
// vez del idItemPedido interno (que no significa nada para el operario) --
// cuenta cuántos ítems del mismo pedido van "antes" bajo ese mismo orden y
// suma 1.
const NUMERO_ITEM = `(
  SELECT COUNT(*) + 1
  FROM "itemPedido" ip3
  WHERE ip3."idPedido" = "${TABLE}"."idPedido"
    AND (
      ip3."fechaEntrega" < "${TABLE}"."fechaEntrega"
      OR (ip3."fechaEntrega" = "${TABLE}"."fechaEntrega" AND ip3."idItemPedido" < "${TABLE}"."idItemPedido")
    )
) as "numeroItem"`;

const getIdEstadoAuto = async (idEmpleado) => {
  const nombre = idEmpleado ? "Asignado" : "Pendiente";
  const estado = await db("estado").where({ nombre }).first();
  return estado?.idEstado ?? null;
};

/**
 * Calcula qué hacer con "fechaTerminado" al cambiar el idEstado de un ítem:
 * - Si el nuevo estado es "Terminado" y el ítem no tenía ya una fecha
 *   registrada, se sella con el momento actual (solo la PRIMERA vez que
 *   pasa a Terminado -- si ya la tenía, no se pisa).
 * - Si el nuevo estado NO es "Terminado" (p. ej. "Reabrir" lo vuelve a
 *   Asignado), se limpia -- ya no es válida, y si se vuelve a marcar
 *   Terminado más adelante debe tomar la fecha de esa nueva vez.
 * - Si el estado nuevo es el mismo que ya tenía, no se toca nada
 *   (undefined = omitir del update).
 * Devuelve el valor a asignar a "fechaTerminado", o `undefined` si no hay
 * que incluirlo en el update.
 */
const calcularFechaTerminado = async (idItemPedido, nuevoIdEstado, qb = db) => {
  const estadoTerminado = await qb("estado").whereRaw("LOWER(nombre) = 'terminado'").first();
  if (!estadoTerminado) return undefined;

  const actual = await qb(TABLE).where({ idItemPedido }).select("idEstado", "fechaTerminado").first();
  if (!actual || actual.idEstado === nuevoIdEstado) return undefined;

  if (nuevoIdEstado === estadoTerminado.idEstado) {
    // OJO: no usar db.fn.now() acá -- un Raw de knex es "thenable", y al
    // devolverlo desde una función async, JS lo trata como una promesa y
    // lo ejecuta de una vez como si fuera su propia consulta (rompe con
    // "CURRENT_TIMESTAMP - error de sintaxis", confirmado en pruebas). Un
    // Date de JS normal no tiene ese problema y knex lo mapea igual a
    // timestamp.
    return actual.fechaTerminado ? undefined : new Date();
  }
  return actual.fechaTerminado != null ? null : undefined;
};

/**
 * Calcula qué hacer con "fechaAsignado" al cambiar el idEmpleado de un ítem
 * -- mismo criterio de "sellar una vez, limpiar al salir" que
 * calcularFechaTerminado(), pero sobre el empleado en vez del estado:
 * - Se asigna a un empleado (antes no tenía, o tenía otro distinto): se
 *   sella con el momento actual -- toda asignación nueva (incluida una
 *   reasignación a otro empleado) cuenta como "asignado ahora" para el
 *   orden de "Mis ítems" (más reciente primero).
 * - Se desasigna (vuelve a null): se limpia.
 * - Si el empleado no cambia, no se toca nada (undefined = omitir del update).
 */
const calcularFechaAsignado = async (idItemPedido, nuevoIdEmpleado, qb = db) => {
  const actual = await qb(TABLE).where({ idItemPedido }).select("idEmpleado", "fechaAsignado").first();
  if (!actual) return undefined;

  const idEmpleadoNormalizado = nuevoIdEmpleado || null;
  if (actual.idEmpleado === idEmpleadoNormalizado) return undefined;

  if (idEmpleadoNormalizado) {
    // Ver nota en calcularFechaTerminado sobre por qué new Date() y no db.fn.now()
    return new Date();
  }
  return actual.fechaAsignado != null ? null : undefined;
};

const formatItem = (item) =>
  item
    ? {
        ...item,
        fechaEntrega: formatFecha(item.fechaEntrega),
        // COUNT(*) de Postgres vuelve como bigint -> node-pg lo entrega como
        // string (mismo criterio ya usado con totalItems en pedido.repository.js).
        numeroItem: item.numeroItem != null ? Number(item.numeroItem) : null,
      }
    : null;

// Sincroniza el estado del pedido según el estado de todos sus ítems.
// Reglas: todos Entregado → pedido Entregado · todos Terminado → pedido Terminado
//         algún ítem Asignado/Terminado/Entregado (sin cumplir lo anterior) → Asignado
//         ninguno de los anteriores → Pendiente
// "No realizado" es manual (solo Admin) y nunca se toca desde acá.
// `idMetodoPago`/`trx`: ver nota en manejarCambioEstadoPedido() -- si este
// cambio completa el pedido a "Entregado" con saldo pendiente, hace falta
// el método de pago o se lanza un error (que revierte TODO lo de la
// transacción `trx`, incluyendo el update del ítem que disparó esto).
const sincronizarEstadoPedido = async (idItemPedido, idMetodoPago, trx = db) => {
  const item = await trx(TABLE).where({ idItemPedido }).first();
  if (!item) return { consolidado: false };

  const pedido = await trx("pedido").where({ idPedido: item.idPedido }).select("idEstado").first();
  if (!pedido) return { consolidado: false };

  // OJO: secuencial, no Promise.all -- `trx` es una única conexión (a
  // diferencia de `db`, que es un pool), así que lanzar varias consultas en
  // paralelo sobre la misma transacción genera "client.query() called while
  // already executing" (confirmado en pruebas; deprecado en pg, se quitará
  // en pg@9). Antes de meter esto en una transacción usaba `db` normal y sí
  // era seguro en paralelo -- ya no.
  const estadoPendiente = await trx("estado").whereRaw("LOWER(nombre) = 'pendiente'").first();
  const estadoAsignado = await trx("estado").whereRaw("LOWER(nombre) = 'asignado'").first();
  const estadoTerminado = await trx("estado").whereRaw("LOWER(nombre) = 'terminado'").first();
  const estadoEntregado = await trx("estado").whereRaw("LOWER(nombre) = 'entregado'").first();
  const estadoNoRealizado = await trx("estado").whereRaw("LOWER(nombre) = 'no realizado'").first();

  if (estadoNoRealizado && pedido.idEstado === estadoNoRealizado.idEstado) return { consolidado: false };

  const items = await trx(TABLE).where({ idPedido: item.idPedido }).select("idEstado");
  if (items.length === 0) return { consolidado: false };

  const todosEntregado = estadoEntregado && items.every((i) => i.idEstado === estadoEntregado.idEstado);
  const todosTerminado = estadoTerminado && items.every((i) => i.idEstado === estadoTerminado.idEstado);
  const algunoEnProceso = items.some((i) =>
    [estadoAsignado?.idEstado, estadoTerminado?.idEstado, estadoEntregado?.idEstado].includes(i.idEstado)
  );

  let nuevoIdEstado = null;
  if (todosEntregado) {
    nuevoIdEstado = estadoEntregado.idEstado;
  } else if (todosTerminado) {
    nuevoIdEstado = estadoTerminado.idEstado;
  } else if (algunoEnProceso) {
    nuevoIdEstado = estadoAsignado?.idEstado ?? null;
  } else if (estadoPendiente) {
    nuevoIdEstado = estadoPendiente.idEstado;
  }

  if (nuevoIdEstado != null && nuevoIdEstado !== pedido.idEstado) {
    await trx("pedido").where({ idPedido: item.idPedido }).update({ idEstado: nuevoIdEstado });
    // Consolida/revierte el saldo automático si el pedido entra o sale de
    // "Entregado" (ver manejarCambioEstadoPedido() en pedido.repository.js).
    return manejarCambioEstadoPedido(item.idPedido, pedido.idEstado, nuevoIdEstado, idMetodoPago, trx);
  }

  return { consolidado: false };
};

// `qb` opcional -- ver misma nota en pedido.repository.js: los llamadores
// dentro de una transacción activa (updateItemPedido, etc) pasan `trx` para
// leer el ítem recién escrito antes del commit.
const BASE_QUERY = (qb = db) =>
  qb(TABLE)
    .leftJoin("empleado as emp", "emp.idEmpleado", `${TABLE}.idEmpleado`)
    .leftJoin("estado as e", "e.idEstado", `${TABLE}.idEstado`)
    .leftJoin("medidas as m", "m.idMedida", `${TABLE}.idMedida`)
    .leftJoin("pedido as p", "p.idPedido", `${TABLE}.idPedido`)
    .leftJoin("cliente as c", "c.idCliente", "p.idCliente")
    .select(
      `${TABLE}.*`,
      qb.raw(`emp.nombres || ' ' || emp.apellidos as "nombreEmpleado"`),
      `e.nombre as nombreEstado`,
      `m.tipoPrenda as tipoPrendaMedida`,
      qb.raw(`c.nombres || ' ' || c.apellidos as "nombreCliente"`),
      `c.telefono as telefonoCliente`,
      qb.raw(FOTOS_ITEM),
      qb.raw(NUMERO_ITEM)
    );

export const getItemsPedido = async (idPedido, fechaInicio, fechaFin, idEmpleado) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let query = BASE_QUERY();

  // "Mis ítems" (idEmpleado sin idPedido -- la cola de trabajo personal de
  // un empleado) ordena por fecha de ASIGNACIÓN, más reciente primero, para
  // que vea de inmediato lo último que le asignaron. NULLS LAST manda los
  // ítems asignados antes de que existiera esta columna (fechaAsignado
  // desconocida) al final, no arriba como si fueran los más recientes.
  // El resto de las vistas (detalle de pedido, "Ítems" admin) siguen
  // ordenando por fecha de entrega (urgencia de la entrega), que tiene más
  // sentido ahí -- no se tocó a propósito.
  if (idEmpleado && !idPedido) {
    query = query.orderByRaw(`"${TABLE}"."fechaAsignado" DESC NULLS LAST, "${TABLE}"."idItemPedido" DESC`);
  } else {
    // Orden por fecha de entrega (lo más próximo primero) -- para que al
    // operario le lleguen sus ítems asignados en orden de urgencia, no por
    // el orden en que se crearon. idItemPedido como segundo criterio, solo
    // para que el orden sea estable entre ítems con la misma fecha.
    query = query.orderBy([
      { column: `${TABLE}.fechaEntrega`, order: "asc" },
      { column: `${TABLE}.idItemPedido`, order: "asc" },
    ]);
  }

  if (idPedido) query = query.where({ [`${TABLE}.idPedido`]: idPedido });
  if (idEmpleado) query = query.where({ [`${TABLE}.idEmpleado`]: idEmpleado });
  if (desde) query = query.where(`${TABLE}.fechaEntrega`, ">=", desde);
  if (hasta) query = query.where(`${TABLE}.fechaEntrega`, "<=", hasta);
  const items = await query;
  return items.map(formatItem);
};

export const getItemPedidoById = async (idItemPedido, qb = db) => {
  const item = await BASE_QUERY(qb)
    .where({ [`${TABLE}.idItemPedido`]: idItemPedido })
    .first();
  return formatItem(item);
};

export const createItemPedido = async (item) => {
  const idEmpleado = item.idEmpleado || null;
  const data = {
    idPedido: item.idPedido,
    idEmpleado,
    idEstado: await getIdEstadoAuto(idEmpleado),
    idMedida: item.idMedida || null,
    valor: item.valor,
    comisionEmpleado: item.comisionEmpleado ?? 50,
    descripcion: mayus(item.descripcion),
    observacion: mayus(item.observacion) || null,
    fechaEntrega: parseFecha(item.fechaEntrega),
    pagado: false,
    // Si ya nace con empleado asignado, cuenta como asignación desde ya
    // (para el orden de "Mis ítems" -- ver calcularFechaAsignado()).
    fechaAsignado: idEmpleado ? new Date() : null,
  };
  // Un ítem recién creado nunca nace en "Entregado" (siempre arranca en
  // Pendiente/Asignado), así que esto nunca puede disparar el error de
  // "falta método de pago" -- igual va en transacción por consistencia.
  return db.transaction(async (trx) => {
    const [newItem] = await trx(TABLE).insert(data).returning("*");
    const consolidacion = await sincronizarEstadoPedido(newItem.idItemPedido, undefined, trx);
    return { item: await getItemPedidoById(newItem.idItemPedido, trx), consolidacion };
  });
};

export const updateItemPedido = async (idItemPedido, item) => {
  // Todo en una sola transacción: si este cambio completa el pedido a
  // "Entregado" con saldo pendiente y falta item.idMetodoPago,
  // sincronizarEstadoPedido()/manejarCambioEstadoPedido() lanzan un error y
  // ACÁ se revierte también el update del ítem de abajo (nunca queda el
  // ítem cambiado pero el pedido a medias).
  return db.transaction(async (trx) => {
    const idEmpleado = item.idEmpleado || null;
    // Respetar idEstado si viene explícitamente; si no, calcular automático
    const idEstado = item.idEstado != null
      ? item.idEstado
      : await getIdEstadoAuto(idEmpleado);
    const fechaTerminado = await calcularFechaTerminado(idItemPedido, idEstado, trx);
    const fechaAsignado = await calcularFechaAsignado(idItemPedido, idEmpleado, trx);
    const data = {
      idEmpleado,
      idEstado,
      idMedida: item.idMedida || null,
      valor: item.valor,
      comisionEmpleado: item.comisionEmpleado ?? 0,
      descripcion: mayus(item.descripcion),
      observacion: mayus(item.observacion) || null,
      fechaEntrega: parseFecha(item.fechaEntrega),
      ...(fechaTerminado !== undefined && { fechaTerminado }),
      ...(fechaAsignado !== undefined && { fechaAsignado }),
    };
    await trx(TABLE).where({ idItemPedido }).update(data);
    const consolidacion = await sincronizarEstadoPedido(idItemPedido, item.idMetodoPago, trx);
    return { item: await getItemPedidoById(idItemPedido, trx), consolidacion };
  });
};

export const cambiarEstadoItem = async (idItemPedido, idEstado, idMetodoPago) => {
  return db.transaction(async (trx) => {
    const fechaTerminado = await calcularFechaTerminado(idItemPedido, idEstado, trx);
    await trx(TABLE)
      .where({ idItemPedido })
      .update({ idEstado, ...(fechaTerminado !== undefined && { fechaTerminado }) });
    const consolidacion = await sincronizarEstadoPedido(idItemPedido, idMetodoPago, trx);
    return { item: await getItemPedidoById(idItemPedido, trx), consolidacion };
  });
};

export const asignarEmpleadoItem = async (idItemPedido, idEmpleado) => {
  // Asignar/desasignar empleado solo mueve el ítem entre Pendiente/Asignado
  // (getIdEstadoAuto), nunca a Entregado -- no puede disparar el error de
  // "falta método de pago", pero igual va en transacción por consistencia.
  return db.transaction(async (trx) => {
    const idEstado = await getIdEstadoAuto(idEmpleado);
    const fechaAsignado = await calcularFechaAsignado(idItemPedido, idEmpleado, trx);
    await trx(TABLE).where({ idItemPedido }).update({
      idEmpleado, idEstado,
      ...(fechaAsignado !== undefined && { fechaAsignado }),
    });
    const consolidacion = await sincronizarEstadoPedido(idItemPedido, undefined, trx);
    return { item: await getItemPedidoById(idItemPedido, trx), consolidacion };
  });
};

export const cambiarComisionItem = async (idItemPedido, comisionEmpleado) => {
  await db(TABLE).where({ idItemPedido }).update({ comisionEmpleado });
  return getItemPedidoById(idItemPedido);
};

// ─── Nómina: marcar ítem como pagado al empleado ───────────────────────────
// Crea movimiento tipo Salida / Abono nómina para que aparezca en movimientos.
// Se usa tipoReferencia='nomina_item' para que no afecte el cálculo de nómina.
export const pagarItemPedido = async (idItemPedido) => {
  const item = await getItemPedidoById(idItemPedido);
  if (!item) throw new Error("Item no encontrado");

  await db(TABLE).where({ idItemPedido }).update({ pagado: true });

  if (item.idEmpleado) {
    const tipoSalida = await db("tipoMovimiento")
      .whereRaw("LOWER(\"nombreTipoMovimiento\") like '%salida%'")
      .first();
    const catNomina = await db("categoriaMovimiento")
      .whereRaw("LOWER(\"nombreCategoriaMovimiento\") like '%n%mina%'")
      .first();

    const valorEmpleado = Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100;
    await db("movimiento").insert({
      idTipoMovimiento: tipoSalida?.idTipoMovimiento ?? 2,
      idCategoriaMovimiento: catNomina?.idCategoriaMovimiento ?? null,
      idMetodoPago: null,
      valor: valorEmpleado,
      tipoReferencia: "nomina_item",
      idReferencia: item.idEmpleado,
      observacion: `Pago nómina — Ítem #${idItemPedido}: ${item.descripcion ?? ""} (${item.comisionEmpleado ?? 0}%)`,
      fecha: db.fn.now(),
    });
  }

  return getItemPedidoById(idItemPedido);
};

// ─── Pago de cliente por ítem ───────────────────────────────────────────────
export const getPagosItem = async (idItemPedido) => {
  const pagos = await db("movimiento as mv")
    .leftJoin("metodoPago as mp", "mp.idMetodoPago", "mv.idMetodoPago")
    .where({ "mv.tipoReferencia": "itemPedido", "mv.idReferencia": idItemPedido })
    .orderBy("mv.fecha", "desc")
    .select("mv.*", "mp.nombreMetodoPago");
  return pagos.map((p) => ({ ...p, fecha: formatFecha(p.fecha) }));
};

export const registrarPago = async (idItemPedido, { idMetodoPago, valor, observacion }) => {
  const item = await getItemPedidoById(idItemPedido);
  if (!item) throw new Error("Item no encontrado");

  const tipoEntrada = await db("tipoMovimiento")
    .whereRaw("LOWER(\"nombreTipoMovimiento\") like '%ingreso%'")
    .first();
  const catPago = await db("categoriaMovimiento")
    .whereRaw("LOWER(\"nombreCategoriaMovimiento\") like '%venta%'")
    .first();

  const obsBase = `Pago ítem #${idItemPedido} — ${item.descripcion ?? ""}`;

  await db("movimiento").insert({
    idTipoMovimiento: tipoEntrada?.idTipoMovimiento ?? 1,
    idCategoriaMovimiento: catPago?.idCategoriaMovimiento ?? null,
    idMetodoPago: idMetodoPago || null,
    valor,
    tipoReferencia: "itemPedido",
    idReferencia: idItemPedido,
    observacion: observacion ? `${obsBase} | ${mayus(observacion)}` : obsBase,
    fecha: db.fn.now(),
  });

  const pagos = await getPagosItem(idItemPedido);
  const totalPagado = pagos.reduce((s, p) => s + Number(p.valor), 0);

  // Total pagado en todos los ítems del mismo pedido (para el recibo del cliente)
  const itemsDelPedido = await db("itemPedido")
    .where({ idPedido: item.idPedido })
    .select("idItemPedido");
  const idsItems = itemsDelPedido.map((i) => i.idItemPedido);
  const movsDelPedido = await db("movimiento")
    .where({ tipoReferencia: "itemPedido" })
    .whereIn("idReferencia", idsItems)
    .select("valor");
  const totalPagadoPedido = movsDelPedido.reduce((s, m) => s + Number(m.valor), 0);

  return {
    item: await getItemPedidoById(idItemPedido),
    totalPagado,
    totalPagadoPedido,
    pagos,
  };
};

export const deleteItemPedido = async (idItemPedido) =>
  db(TABLE).where({ idItemPedido }).del();
