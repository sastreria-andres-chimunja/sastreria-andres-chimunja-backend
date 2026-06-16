import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "itemPedido";

const getIdEstadoAuto = async (idEmpleado) => {
  const nombre = idEmpleado ? "Asignado" : "Pendiente";
  const estado = await db("estado").where({ nombre }).first();
  return estado?.idEstado ?? null;
};

const formatItem = (item) =>
  item ? { ...item, fechaEntrega: formatFecha(item.fechaEntrega) } : null;

const BASE_QUERY = () =>
  db(TABLE)
    .leftJoin("empleado as emp", "emp.idEmpleado", `${TABLE}.idEmpleado`)
    .leftJoin("estado as e", "e.idEstado", `${TABLE}.idEstado`)
    .leftJoin("medidas as m", "m.idMedida", `${TABLE}.idMedida`)
    .select(
      `${TABLE}.*`,
      db.raw(`emp.nombres || ' ' || emp.apellidos as "nombreEmpleado"`),
      `e.nombre as nombreEstado`,
      `m.tipoPrenda as tipoPrendaMedida`
    );

export const getItemsPedido = async (idPedido, fechaInicio, fechaFin) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);
  let query = BASE_QUERY().orderBy(`${TABLE}.idItemPedido`, "asc");
  if (idPedido) query = query.where({ [`${TABLE}.idPedido`]: idPedido });
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
    comisionEmpleado: item.comisionEmpleado || 0,
    descripcion: item.descripcion,
    observacion: item.observacion || null,
    fechaEntrega: parseFecha(item.fechaEntrega),
    pagado: false,
  };
  const [newItem] = await db(TABLE).insert(data).returning("*");
  return getItemPedidoById(newItem.idItemPedido);
};

export const updateItemPedido = async (idItemPedido, item) => {
  const idEmpleado = item.idEmpleado || null;
  const data = {
    idEmpleado,
    idEstado: await getIdEstadoAuto(idEmpleado),
    idMedida: item.idMedida || null,
    valor: item.valor,
    comisionEmpleado: item.comisionEmpleado || 0,
    descripcion: item.descripcion,
    observacion: item.observacion || null,
    fechaEntrega: parseFecha(item.fechaEntrega),
  };
  await db(TABLE).where({ idItemPedido }).update(data);
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
