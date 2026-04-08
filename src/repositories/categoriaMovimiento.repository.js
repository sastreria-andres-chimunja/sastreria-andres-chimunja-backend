import db from "../config/database.js";

const TABLE = "categoriaMovimiento";

export const getCategoriaMovimientoById = async (idCategoriaMovimiento) => {
  return db(TABLE).where({ idCategoriaMovimiento }).first();
};
export const getCategoriaMovimientoByName = async (nombreMovimiento) => {
  return db(TABLE).where({ nombreMovimiento });
};
export const getCategoriasMovimiento = async () => {
  return db(TABLE);
};

export const createCategoriaMovimiento = async (categoriaMovimiento) => {
  const [newCategoriaMovimiento] = await db(TABLE)
    .insert(categoriaMovimiento)
    .returning("*");

  return newCategoriaMovimiento;
};

export const updateCategoriaMovimiento = async (
  idCategoriaMovimiento,
  categoriaMovimiento,
) => {
  const [updated] = await db(TABLE)
    .where({ idCategoriaMovimiento })
    .update(categoriaMovimiento)
    .returning("*");

  return updated;
};

export const deleteCategoriaMovimiento = async (idCategoriaMovimiento) => {
  return db(TABLE).where({ idCategoriaMovimiento }).del();
};
