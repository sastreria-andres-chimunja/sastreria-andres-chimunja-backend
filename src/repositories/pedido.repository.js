import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "pedido";

const formatPedido = (p) =>
  p
    ? {
        ...p,
        fechaRecibido: formatFecha(p.fechaRecibido),
        fechaEntrega: formatFecha(p.fechaEntrega),
        created_at: formatFecha(p.created_at),
        updated_at: formatFecha(p.updated_at),
        totalAbonado: p.totalAbonado != null ? Number(p.totalAbonado) : 0,
      }
    : null;

// Suma de abonos ya registrados para el pedido (tipoReferencia='pedido'),
// como subconsulta correlacionada para no arrastrar duplicados por el JOIN.
const TOTAL_ABONADO = `(
  SELECT COALESCE(SUM(mv.valor), 0)
  FROM movimiento mv
  WHERE mv."tipoReferencia" = 'pedido' AND mv."idReferencia" = "${TABLE}"."idPedido"
) as "totalAbonado"`;

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
      db.raw(TOTAL_ABONADO)
    );

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
  const data = {
    idCliente: pedido.idCliente,
    idEstado: pedido.idEstado,
    idTipoPedido: pedido.idTipoPedido,
    valorTotal: pedido.valorTotal,
    fechaRecibido: parseFecha(pedido.fechaRecibido),
    fechaEntrega: parseFecha(pedido.fechaEntrega),
  };
  await db(TABLE).where({ idPedido }).update(data);
  return getPedidoById(idPedido);
};

export const deletePedido = async (idPedido) =>
  db(TABLE).where({ idPedido }).del();

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
