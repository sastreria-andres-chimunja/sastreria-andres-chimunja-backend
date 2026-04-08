import db from "../config/database.js";

const TABLE = "movimiento";

export const getMovimientoById = async (idMovimiento) => {
  return db(TABLE).where({ idMovimiento }).first();
};

export const getMovimientos = async () => {
  return db(TABLE);
};

export const createMovimiento = async (movimiento) => {
  const [newMovimiento] = await db(TABLE).insert(movimiento).returning("*");

  return newMovimiento;
};

export const updateMovimiento = async (idMovimiento, movimiento) => {
  const [updated] = await db(TABLE)
    .where({ idMovimiento })
    .update(movimiento)
    .returning("*");

  return updated;
};

export const deleteMovimiento = async (idMovimiento) => {
  return db(TABLE).where({ idMovimiento }).del();
};
