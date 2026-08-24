import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";
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
const calcularFechaTerminado = async (idItemPedido, nuevoIdEstado) => {
  const estadoTerminado = await db("estado").whereRaw("LOWER(nombre) = 'terminado'").first();
  if (!estadoTerminado) return undefined;

  const actual = await db(TABLE).where({ idItemPedido }).select("idEstado", "fechaTerminado").first();
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

const formatItem = (item) =>
  item ? { ...item, fechaEntrega: formatFecha(item.fechaEntrega) } : null;

// Sincroniza el estado del pedido según el estado de todos sus ítems.
// Reglas: todos Entregado → pedido Entregado · todos Terminado → pedido Terminado
//         algún ítem Asignado/Terminado/Entregado (sin cumplir lo anterior) → Asignado
//         ninguno de los anteriores → Pendiente
// "No realizado" es manual (solo Admin) y nunca se toca desde acá.
const sincronizarEstadoPedido = async (idItemPedido) => {
  const item = await db(TABLE).where({ idItemPedido }).first();
  if (!item) return { consolidado: false };

  const pedido = await db("pedido").where({ idPedido: item.idPedido }).select("idEstado").first();
  if (!pedido) return { consolidado: false };

  const [estadoPendiente, estadoAsignado, estadoTerminado, estadoEntregado, estadoNoRealizado] = await Promise.all([
    db("estado").whereRaw("LOWER(nombre) = 'pendiente'").first(),
    db("estado").whereRaw("LOWER(nombre) = 'asignado'").first(),
    db("estado").whereRaw("LOWER(nombre) = 'terminado'").first(),
    db("estado").whereRaw("LOWER(nombre) = 'entregado'").first(),
    db("estado").whereRaw("LOWER(nombre) = 'no realizado'").first(),
  ]);

  if (estadoNoRealizado && pedido.idEstado === estadoNoRealizado.idEstado) return { consolidado: false };

  const items = await db(TABLE).where({ idPedido: item.idPedido }).select("idEstado");
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
    await db("pedido").where({ idPedido: item.idPedido }).update({ idEstado: nuevoIdEstado });
    // Consolida/revierte el saldo automático si el pedido entra o sale de
    // "Entregado" (ver manejarCambioEstadoPedido() en pedido.repository.js).
    return manejarCambioEstadoPedido(item.idPedido, pedido.idEstado, nuevoIdEstado);
  }

  return { consolidado: false };
};

const BASE_QUERY = () =>
  db(TABLE)
    .leftJoin("empleado as emp", "emp.idEmpleado", `${TABLE}.idEmpleado`)
    .leftJoin("estado as e", "e.idEstado", `${TABLE}.idEstado`)
    .leftJoin("medidas as m", "m.idMedida", `${TABLE}.idMedida`)
    .leftJoin("pedido as p", "p.idPedido", `${TABLE}.idPedido`)
    .leftJoin("cliente as c", "c.idCliente", "p.idCliente")
    .select(
      `${TABLE}.*`,
      db.raw(`emp.nombres || ' ' || emp.apellidos as "nombreEmpleado"`),
      `e.nombre as nombreEstado`,
      `m.tipoPrenda as tipoPrendaMedida`,
      db.raw(`c.nombres || ' ' || c.apellidos as "nombreCliente"`),
      `c.telefono as telefonoCliente`,
      db.raw(FOTOS_ITEM)
    );

export const getItemsPedido = async (idPedido, fechaInicio, fechaFin, idEmpleado) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);
  // Orden por fecha de entrega (lo más próximo primero) -- para que al
  // operario le lleguen sus ítems asignados en orden de urgencia, no por
  // el orden en que se crearon. idItemPedido como segundo criterio, solo
  // para que el orden sea estable entre ítems con la misma fecha.
  let query = BASE_QUERY().orderBy([
    { column: `${TABLE}.fechaEntrega`, order: "asc" },
    { column: `${TABLE}.idItemPedido`, order: "asc" },
  ]);
  if (idPedido) query = query.where({ [`${TABLE}.idPedido`]: idPedido });
  if (idEmpleado) query = query.where({ [`${TABLE}.idEmpleado`]: idEmpleado });
  if (desde) query = query.where(`${TABLE}.fechaEntrega`, ">=", desde);
  if (hasta) query = query.where(`${TABLE}.fechaEntrega`, "<=", hasta);
  const items = await query;
  return items.map(formatItem);
};

export const getItemPedidoById = async (idItemPedido) => {
  const item = await BASE_QUERY()
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
    descripcion: item.descripcion,
    observacion: item.observacion || null,
    fechaEntrega: parseFecha(item.fechaEntrega),
    pagado: false,
  };
  const [newItem] = await db(TABLE).insert(data).returning("*");
  const consolidacion = await sincronizarEstadoPedido(newItem.idItemPedido);
  return { item: await getItemPedidoById(newItem.idItemPedido), consolidacion };
};

export const updateItemPedido = async (idItemPedido, item) => {
  const idEmpleado = item.idEmpleado || null;
  // Respetar idEstado si viene explícitamente; si no, calcular automático
  const idEstado = item.idEstado != null
    ? item.idEstado
    : await getIdEstadoAuto(idEmpleado);
  const fechaTerminado = await calcularFechaTerminado(idItemPedido, idEstado);
  const data = {
    idEmpleado,
    idEstado,
    idMedida: item.idMedida || null,
    valor: item.valor,
    comisionEmpleado: item.comisionEmpleado ?? 0,
    descripcion: item.descripcion,
    observacion: item.observacion || null,
    fechaEntrega: parseFecha(item.fechaEntrega),
    ...(fechaTerminado !== undefined && { fechaTerminado }),
  };
  await db(TABLE).where({ idItemPedido }).update(data);
  const consolidacion = await sincronizarEstadoPedido(idItemPedido);
  return { item: await getItemPedidoById(idItemPedido), consolidacion };
};

export const cambiarEstadoItem = async (idItemPedido, idEstado) => {
  const fechaTerminado = await calcularFechaTerminado(idItemPedido, idEstado);
  await db(TABLE)
    .where({ idItemPedido })
    .update({ idEstado, ...(fechaTerminado !== undefined && { fechaTerminado }) });
  const consolidacion = await sincronizarEstadoPedido(idItemPedido);
  return { item: await getItemPedidoById(idItemPedido), consolidacion };
};

export const asignarEmpleadoItem = async (idItemPedido, idEmpleado) => {
  const idEstado = await getIdEstadoAuto(idEmpleado);
  await db(TABLE).where({ idItemPedido }).update({ idEmpleado, idEstado });
  const consolidacion = await sincronizarEstadoPedido(idItemPedido);
  return { item: await getItemPedidoById(idItemPedido), consolidacion };
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
    observacion: observacion ? `${obsBase} | ${observacion}` : obsBase,
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
