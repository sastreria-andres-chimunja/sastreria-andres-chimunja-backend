import db from "../config/database.js";

const TABLE = "medidas";

export const getMedidaById = async (idMedida) => {
  return db(TABLE).where({ idMedida }).first();
};
export const getMedidasByClientId = async (idCliente) => {
  return db(TABLE).where({ idCliente });
};

export const createMedida = async (medida) => {
  const [newMedida] = await db(TABLE).insert(medida).returning("*");

  return newMedida;
};

export const updateMedida = async (idMedida, medida) => {
  const [updated] = await db(TABLE)
    .where({ idMedida })
    .update(medida)
    .returning("*");

  return updated;
};

export const deleteMedida = async (idMedida) => {
  return db(TABLE).where({ idMedida }).del();
};
