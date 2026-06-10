import db from "../config/database.js";

const TABLE = "metodoPago";

export const getMetodoPagoById = async (idMetodo) => {
  return db(TABLE).where({ idMetodo }).first();
};
export const getMetodoPagoByName = async (nombreMetodo) => {
  return db(TABLE).where({ nombreMetodo });
};
export const getMetodos = async () => {
  return db(TABLE);
};

export const createMetodoPago = async (metodoPago) => {
  const [newMetodoPago] = await db(TABLE).insert(metodoPago).returning("*");

  return newMetodoPago;
};

export const updateMetodoPago = async (idMetodoPago, metodoPago) => {
  const [updated] = await db(TABLE)
    .where({ idMetodoPago })
    .update(metodoPago)
    .returning("*");

  return updated;
};

export const deleteMetodoPago = async (idMetodoPago) => {
  return db(TABLE).where({ idMetodoPago }).del();
};
