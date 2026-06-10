import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "itemPedido";

const formatItem = (item) =>
  item ? { ...item, fechaEntrega: formatFecha(item.fechaEntrega) } : null;

export const getItemsPedido = async (idPedido, fechaInicio, fechaFin) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);
  let query = db(TABLE).orderBy("idItemPedido", "asc");
  if (idPedido) query = query.where({ idPedido });
  if (desde) query = query.where("fechaEntrega", ">=", desde);
  if (hasta) query = query.where("fechaEntrega", "<=", hasta);
  const items = await query;
  return items.map(formatItem);
};

export const getItemPedidoById = async (idItemPedido) => {
  const item = await db(TABLE).where({ idItemPedido }).first();
  return formatItem(item);
};

export const createItemPedido = async (item) => {
  const data = { ...item, fechaEntrega: parseFecha(item.fechaEntrega) };
  const [newItem] = await db(TABLE).insert(data).returning("*");
  return formatItem(newItem);
};

export const updateItemPedido = async (idItemPedido, item) => {
  const data = { ...item, fechaEntrega: parseFecha(item.fechaEntrega) };
  const [updated] = await db(TABLE)
    .where({ idItemPedido })
    .update(data)
    .returning("*");
  return formatItem(updated);
};

export const deleteItemPedido = async (idItemPedido) =>
  db(TABLE).where({ idItemPedido }).del();
