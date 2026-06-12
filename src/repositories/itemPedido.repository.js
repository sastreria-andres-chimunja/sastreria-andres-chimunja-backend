import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "itemPedido";

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
  const data = {
    idPedido: item.idPedido,
    idEmpleado: item.idEmpleado || null,
    idEstado: item.idEstado || null,
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
  const data = {
    idEmpleado: item.idEmpleado || null,
    idEstado: item.idEstado || null,
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

export const pagarItemPedido = async (idItemPedido) => {
  await db(TABLE).where({ idItemPedido }).update({ pagado: true });
  return getItemPedidoById(idItemPedido);
};

export const deleteItemPedido = async (idItemPedido) =>
  db(TABLE).where({ idItemPedido }).del();
