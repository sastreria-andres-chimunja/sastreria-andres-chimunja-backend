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
      }
    : null;

export const getPedidos = async (fechaInicio, fechaFin) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);
  let query = db(TABLE).orderBy("created_at", "desc");
  if (desde) query = query.where("fechaEntrega", ">=", desde);
  if (hasta) query = query.where("fechaEntrega", "<=", hasta);
  const pedidos = await query;
  return pedidos.map(formatPedido);
};

export const getPedidoById = async (idPedido) => {
  const p = await db(TABLE).where({ idPedido }).first();
  return formatPedido(p);
};

export const createPedido = async (pedido) => {
  const data = {
    ...pedido,
    fechaRecibido: parseFecha(pedido.fechaRecibido),
    fechaEntrega: parseFecha(pedido.fechaEntrega),
  };
  const [newPedido] = await db(TABLE).insert(data).returning("*");
  return formatPedido(newPedido);
};

export const updatePedido = async (idPedido, pedido) => {
  const data = {
    ...pedido,
    fechaRecibido: parseFecha(pedido.fechaRecibido),
    fechaEntrega: parseFecha(pedido.fechaEntrega),
  };
  const [updated] = await db(TABLE)
    .where({ idPedido })
    .update(data)
    .returning("*");
  return formatPedido(updated);
};

export const deletePedido = async (idPedido) =>
  db(TABLE).where({ idPedido }).del();
