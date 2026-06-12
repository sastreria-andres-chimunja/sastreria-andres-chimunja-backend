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

const BASE_QUERY = () =>
  db(TABLE)
    .leftJoin("cliente as c", "c.idCliente", `${TABLE}.idCliente`)
    .leftJoin("estado as e", "e.idEstado", `${TABLE}.idEstado`)
    .select(
      `${TABLE}.*`,
      db.raw(`c.nombres || ' ' || c.apellidos as "nombreCliente"`),
      `c.telefono as telefonoCliente`,
      `e.nombre as nombreEstado`
    );

export const getPedidos = async (fechaInicio, fechaFin) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);
  let query = BASE_QUERY().orderBy(`${TABLE}.created_at`, "desc");
  if (desde) query = query.where(`${TABLE}.fechaEntrega`, ">=", desde);
  if (hasta) query = query.where(`${TABLE}.fechaEntrega`, "<=", hasta);
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
    valorTotal: pedido.valorTotal,
    fechaRecibido: parseFecha(pedido.fechaRecibido),
    fechaEntrega: parseFecha(pedido.fechaEntrega),
  };
  await db(TABLE).where({ idPedido }).update(data);
  return getPedidoById(idPedido);
};

export const deletePedido = async (idPedido) =>
  db(TABLE).where({ idPedido }).del();
