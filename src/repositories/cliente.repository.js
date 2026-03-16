import db from "../config/database.js";

const TABLE = "cliente";

export const getAllClientes = async () => {
  return db(TABLE).select("*");
};

export const getClienteById = async (id) => {
  return db(TABLE).where({ idCliente: id }).first();
};
export const getClienteByIdentification = async (identification) => {
  return db(TABLE).where({ cedula: identification }).first();
};

export const searchClientes = async (text) => {
  return db(TABLE)
    .where("nombres", "ilike", `%${text}%`)
    .orWhere("apellidos", "ilike", `%${text}%`)
    .orWhere("telefono", "ilike", `%${text}%`)
    .orWhere("cedula", "ilike", `%${text}%`);
};

export const createCliente = async (cliente) => {
  const [newCliente] = await db(TABLE).insert(cliente).returning("*");

  return newCliente;
};

export const updateCliente = async (id, cliente) => {
  const [updated] = await db(TABLE)
    .where({ idCliente: id })
    .update(cliente)
    .returning("*");

  return updated;
};

export const deleteCliente = async (id) => {
  return db(TABLE).where({ idCliente: id }).del();
};
