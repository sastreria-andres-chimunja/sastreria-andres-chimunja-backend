import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";
import { generarTokenPedido } from "../utils/pedidoToken.utils.js";

const TABLE = "pedido";

const formatPedido = (p) =>
  p
    ? {
        ...p,
        fechaRecibido: formatFecha(p.fechaRecibido),
        fechaEntrega: formatFecha(p.fechaEntrega),
        fechaEntregado: formatFecha(p.fechaEntregado),
        created_at: formatFecha(p.created_at),
        updated_at: formatFecha(p.updated_at),
        totalAbonado: p.totalAbonado != null ? Number(p.totalAbonado) : 0,
        totalItems: p.totalItems != null ? Number(p.totalItems) : 0,
        itemsTerminados: p.itemsTerminados != null ? Number(p.itemsTerminados) : 0,
        tokenPublico: generarTokenPedido(p.idPedido),
      }
    : null;

// Suma de abonos ya registrados para el pedido (tipoReferencia='pedido'),
// como subconsulta correlacionada para no arrastrar duplicados por el JOIN.
const TOTAL_ABONADO = `(
  SELECT COALESCE(SUM(mv.valor), 0)
  FROM movimiento mv
  WHERE mv."tipoReferencia" = 'pedido' AND mv."idReferencia" = "${TABLE}"."idPedido"
) as "totalAbonado"`;

// Cantidad de ítems del pedido y cuántos ya están Terminado o Entregado
// (ambos cuentan como "trabajo terminado" -- Entregado es simplemente un
// paso más allá de Terminado) -- para mostrar "X/Y ítems terminados" en
// la tarjeta sin tener que traer cada ítem completo.
const TOTAL_ITEMS = `(
  SELECT COUNT(*) FROM "itemPedido" ip WHERE ip."idPedido" = "${TABLE}"."idPedido"
) as "totalItems"`;

const ITEMS_TERMINADOS = `(
  SELECT COUNT(*) FROM "itemPedido" ip
  JOIN estado e2 ON e2."idEstado" = ip."idEstado"
  WHERE ip."idPedido" = "${TABLE}"."idPedido" AND LOWER(e2.nombre) IN ('terminado', 'entregado')
) as "itemsTerminados"`;

// Nombre del empleado a mostrar en la tarjeta de "Hoja de trabajo":
// - Si el pedido no tiene ítems, o alguno todavía no tiene empleado
//   asignado, no se muestra nombre (NULL) -- el paquete no está completo
//   "para" nadie todavía.
// - Si TODOS los ítems están asignados al mismo empleado, se muestra su
//   nombre.
// - Si están repartidos entre 2+ empleados distintos, se muestra "Varios".
const EMPLEADO_ASIGNADO = `(
  SELECT CASE
    WHEN COUNT(*) = 0 THEN NULL
    WHEN COUNT(*) FILTER (WHERE ip."idEmpleado" IS NULL) > 0 THEN NULL
    WHEN COUNT(DISTINCT ip."idEmpleado") = 1 THEN MAX(e2.nombres || ' ' || e2.apellidos)
    ELSE 'Varios'
  END
  FROM "itemPedido" ip
  LEFT JOIN empleado e2 ON e2."idEmpleado" = ip."idEmpleado"
  WHERE ip."idPedido" = "${TABLE}"."idPedido"
) as "empleadoAsignado"`;

// Fotos de referencia de TODOS los ítems del pedido, juntas en un solo
// arreglo (para la tarjeta de "Hoja de trabajo": mostrar si tiene o no
// fotos, y poder ampliarlas, sin tener que abrir cada ítem por separado).
const FOTOS_PEDIDO = `(
  SELECT COALESCE(
    json_agg(json_build_object('idImagen', img."idImagen", 'rutaImagen', img."rutaImagen") ORDER BY img."idImagen"),
    '[]'
  )
  FROM imagenes img
  JOIN "itemPedido" ip2 ON ip2."idItemPedido" = img."idReferencia" AND img."tipoReferencia" = 'itemPedido'
  WHERE ip2."idPedido" = "${TABLE}"."idPedido"
) as "fotos"`;

const BASE_QUERY = () =>
  db(TABLE)
    .leftJoin("cliente as c", "c.idCliente", `${TABLE}.idCliente`)
    .leftJoin("estado as e", "e.idEstado", `${TABLE}.idEstado`)
    .leftJoin("tipoPedido as tp", "tp.idTipoPedido", `${TABLE}.idTipoPedido`)
    .select(
      `${TABLE}.*`,
      db.raw(`c.nombres || ' ' || c.apellidos as "nombreCliente"`),
      `c.telefono as telefonoCliente`,
      `e.nombre as nombreEstado`,
      `tp.nombre as nombreTipoPedido`,
      db.raw(TOTAL_ABONADO),
      db.raw(TOTAL_ITEMS),
      db.raw(ITEMS_TERMINADOS),
      db.raw(EMPLEADO_ASIGNADO),
      db.raw(FOTOS_PEDIDO)
    );

/**
 * Se llama cada vez que el idEstado de un pedido CAMBIA, desde cualquiera
 * de los dos caminos que existen (sincronizarEstadoPedido() en
 * itemPedido.repository.js cuando cambia por los ítems, o la edición
 * manual de "Estado del pedido" en updatePedido() acá mismo):
 * - Si el nuevo estado es "Entregado" y antes no lo era: consolida el
 *   saldo pendiente (valorTotal - abonado) en un abono automático
 *   (movimiento.autoGenerado=true) y sella fechaEntregado -- así no hace
 *   falta registrar un abono aparte por lo que quede pendiente al
 *   entregar.
 * - Si el estado ANTERIOR era "Entregado" y el nuevo ya no lo es: revierte
 *   -- borra ese abono automático (si existe) y limpia fechaEntregado.
 * Devuelve { consolidado, monto? } para que el llamador pueda avisarle al
 * usuario si se generó un abono automático.
 */
export const manejarCambioEstadoPedido = async (idPedido, idEstadoAnterior, idEstadoNuevo) => {
  if (idEstadoAnterior === idEstadoNuevo) return { consolidado: false };

  const estadoEntregado = await db("estado").whereRaw("LOWER(nombre) = 'entregado'").first();
  if (!estadoEntregado) return { consolidado: false };

  if (idEstadoNuevo === estadoEntregado.idEstado && idEstadoAnterior !== estadoEntregado.idEstado) {
    const pedido = await db(TABLE).where({ idPedido }).first();
    if (!pedido) return { consolidado: false };

    await db(TABLE).where({ idPedido }).update({ fechaEntregado: new Date() });

    const abonos = await db("movimiento")
      .where({ tipoReferencia: "pedido", idReferencia: idPedido })
      .select("valor");
    const totalAbonado = abonos.reduce((s, a) => s + Number(a.valor ?? 0), 0);
    const saldo = Number(pedido.valorTotal ?? 0) - totalAbonado;

    if (saldo > 0.01) {
      const tipoEntrada = await db("tipoMovimiento")
        .whereRaw("LOWER(\"nombreTipoMovimiento\") like '%ingreso%'")
        .first();
      const catPago = await db("categoriaMovimiento")
        .whereRaw("LOWER(\"nombreCategoriaMovimiento\") like '%venta%'")
        .first();
      await db("movimiento").insert({
        idTipoMovimiento: tipoEntrada?.idTipoMovimiento ?? 1,
        idCategoriaMovimiento: catPago?.idCategoriaMovimiento ?? null,
        idMetodoPago: null,
        valor: saldo,
        tipoReferencia: "pedido",
        idReferencia: idPedido,
        observacion: `Saldo consolidado automáticamente al marcar el pedido #${idPedido} como Entregado`,
        autoGenerado: true,
        fecha: new Date(),
      });
      return { consolidado: true, monto: saldo };
    }
    return { consolidado: false };
  }

  if (idEstadoAnterior === estadoEntregado.idEstado && idEstadoNuevo !== estadoEntregado.idEstado) {
    await db("movimiento")
      .where({ tipoReferencia: "pedido", idReferencia: idPedido, autoGenerado: true })
      .del();
    await db(TABLE).where({ idPedido }).update({ fechaEntregado: null });
  }

  return { consolidado: false };
};

export const getPedidos = async (fechaInicio, fechaFin, idEmpleado) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);
  let query = BASE_QUERY().orderBy(`${TABLE}.created_at`, "desc");
  if (desde) query = query.where(`${TABLE}.fechaEntrega`, ">=", desde);
  if (hasta) query = query.where(`${TABLE}.fechaEntrega`, "<=", hasta);

  // Filtro por operario: solo pedidos que tienen al menos un ítem asignado a ese empleado
  if (idEmpleado) {
    query = query.whereExists(
      db("itemPedido as ip")
        .where("ip.idPedido", db.raw(`"${TABLE}"."idPedido"`))
        .where("ip.idEmpleado", idEmpleado)
    );
  }

  const pedidos = await query;
  return pedidos.map(formatPedido);
};

export const getPedidoById = async (idPedido) => {
  const p = await BASE_QUERY().where({ [`${TABLE}.idPedido`]: idPedido }).first();
  return formatPedido(p);
};

export const createPedido = async (pedido) => {
  const data = {
    idCliente: pedido.idCliente,
    idEstado: pedido.idEstado,
    idTipoPedido: pedido.idTipoPedido,
    valorTotal: pedido.valorTotal,
    fechaRecibido: parseFecha(pedido.fechaRecibido),
    fechaEntrega: parseFecha(pedido.fechaEntrega),
  };
  const [newPedido] = await db(TABLE).insert(data).returning("*");
  return getPedidoById(newPedido.idPedido);
};

export const updatePedido = async (idPedido, pedido) => {
  const anterior = await db(TABLE).where({ idPedido }).select("idEstado").first();
  const data = {
    idCliente: pedido.idCliente,
    idEstado: pedido.idEstado,
    idTipoPedido: pedido.idTipoPedido,
    valorTotal: pedido.valorTotal,
    fechaRecibido: parseFecha(pedido.fechaRecibido),
    fechaEntrega: parseFecha(pedido.fechaEntrega),
  };
  await db(TABLE).where({ idPedido }).update(data);

  // "Estado del pedido" también se puede editar a mano acá (sin pasar por
  // los ítems) -- si el cambio entra o sale de "Entregado", igual hay que
  // consolidar/revertir el saldo (ver manejarCambioEstadoPedido()).
  const consolidacion = anterior
    ? await manejarCambioEstadoPedido(idPedido, anterior.idEstado, pedido.idEstado)
    : { consolidado: false };

  const pedidoActualizado = await getPedidoById(idPedido);
  return { pedido: pedidoActualizado, consolidacion };
};

export const deletePedido = async (idPedido) =>
  db(TABLE).where({ idPedido }).del();

/**
 * Revierte manualmente un pedido de "Entregado" a "Terminado" (acción de
 * Admin/Asistente) -- devuelve todos sus ítems Entregado a Terminado y
 * reutiliza manejarCambioEstadoPedido() para deshacer el consolidado
 * automático del saldo (si lo hubo) y limpiar fechaEntregado.
 */
export const revertirPedidoEntregado = async (idPedido) => {
  const pedido = await db(TABLE).where({ idPedido }).first();
  if (!pedido) throw new Error("Pedido no encontrado");

  const estadoEntregado = await db("estado").whereRaw("LOWER(nombre) = 'entregado'").first();
  const estadoTerminado = await db("estado").whereRaw("LOWER(nombre) = 'terminado'").first();
  if (!estadoEntregado || pedido.idEstado !== estadoEntregado.idEstado) {
    throw new Error("El pedido no está en estado Entregado");
  }
  if (!estadoTerminado) throw new Error("No existe el estado 'Terminado'");

  await db("itemPedido")
    .where({ idPedido, idEstado: estadoEntregado.idEstado })
    .update({ idEstado: estadoTerminado.idEstado });
  await db(TABLE).where({ idPedido }).update({ idEstado: estadoTerminado.idEstado });
  await manejarCambioEstadoPedido(idPedido, estadoEntregado.idEstado, estadoTerminado.idEstado);

  return getPedidoById(idPedido);
};

// ─── Límite diario de entregas ──────────────────────────────────────────────
// Suma el valor total ya programado para una fecha de entrega, excluyendo
// pedidos "No realizado" (no compiten por la capacidad de ese día) y,
// opcionalmente, un pedido puntual (para revalidar al editar su propio monto).
export const getValorProgramado = async (fechaEntrega, excluirIdPedido) => {
  const fecha = parseFecha(fechaEntrega);
  if (!fecha) return 0;

  let query = db(TABLE)
    .leftJoin("estado as e", "e.idEstado", `${TABLE}.idEstado`)
    .where(`${TABLE}.fechaEntrega`, fecha)
    .whereRaw(`(e.nombre IS NULL OR LOWER(e.nombre) <> 'no realizado')`);

  if (excluirIdPedido) query = query.whereNot(`${TABLE}.idPedido`, excluirIdPedido);

  const { total } = await query.sum({ total: `${TABLE}.valorTotal` }).first();
  return Number(total) || 0;
};

// ─── Abonos de cliente a nivel de pedido ────────────────────────────────────
export const getAbonosPedido = async (idPedido) => {
  const abonos = await db("movimiento as mv")
    .leftJoin("metodoPago as mp", "mp.idMetodoPago", "mv.idMetodoPago")
    .where({ "mv.tipoReferencia": "pedido", "mv.idReferencia": idPedido })
    .orderBy("mv.fecha", "desc")
    .select("mv.*", "mp.nombreMetodoPago");
  return abonos.map((a) => ({ ...a, fecha: formatFecha(a.fecha) }));
};

export const registrarAbonoPedido = async (idPedido, { idMetodoPago, valor, observacion }) => {
  const pedido = await getPedidoById(idPedido);
  if (!pedido) throw new Error("Pedido no encontrado");

  const tipoEntrada = await db("tipoMovimiento")
    .whereRaw("LOWER(\"nombreTipoMovimiento\") like '%ingreso%'")
    .first();
  const catPago = await db("categoriaMovimiento")
    .whereRaw("LOWER(\"nombreCategoriaMovimiento\") like '%venta%'")
    .first();

  const obsBase = `Abono pedido #${idPedido}`;
  await db("movimiento").insert({
    idTipoMovimiento: tipoEntrada?.idTipoMovimiento ?? 1,
    idCategoriaMovimiento: catPago?.idCategoriaMovimiento ?? null,
    idMetodoPago: idMetodoPago || null,
    valor,
    tipoReferencia: "pedido",
    idReferencia: idPedido,
    observacion: observacion ? `${obsBase} | ${observacion}` : obsBase,
    fecha: db.fn.now(),
  });

  const abonos = await getAbonosPedido(idPedido);
  const totalAbonado = abonos.reduce((s, a) => s + Number(a.valor), 0);

  return { pedido, totalAbonado, abonos };
};
