import db from "../config/database.js";

const TABLE = "tipoPedido";

export const getTiposPedido = async () => db(TABLE).orderBy("idTipoPedido", "asc");

export const getTipoPedidoById = async (idTipoPedido) =>
  db(TABLE).where({ idTipoPedido }).first();
