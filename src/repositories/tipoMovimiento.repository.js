import db from "../config/database.js";

const TABLE = "tipoMovimiento";

export const getTipoMovimientoById = async (idTipoMovimiento) => {
  return db(TABLE).where({ idTipoMovimiento }).first();
};
export const getTipoMovimientoByName = async (nombreTipoMovimiento) => {
  return db(TABLE).where({ nombreTipoMovimiento });
};
export const getTiposMovimiento = async () => {
  return db(TABLE);
};

export const createTipoMovimiento = async (tipoMovimiento) => {
  const [newTipoMovimiento] = await db(TABLE)
    .insert(tipoMovimiento)
    .returning("*");

  return newTipoMovimiento;
};

export const updateTipoMovimiento = async (
  idTipoMovimiento,
  tipoMovimiento,
) => {
  const [updated] = await db(TABLE)
    .where({ idTipoMovimiento })
    .update(tipoMovimiento)
    .returning("*");

  return updated;
};

export const deleteTipoMovimiento = async (idTipoMovimiento) => {
  return db(TABLE).where({ idTipoMovimiento }).del();
};
