import db from "../config/database.js";

const TABLE = "estado";

export const getEstados = async () => db(TABLE).orderBy("idEstado", "asc");

export const getEstadoById = async (idEstado) =>
  db(TABLE).where({ idEstado }).first();

export const createEstado = async (estado) => {
  const [newEstado] = await db(TABLE).insert(estado).returning("*");
  return newEstado;
};

export const updateEstado = async (idEstado, estado) => {
  const [updated] = await db(TABLE)
    .where({ idEstado })
    .update(estado)
    .returning("*");
  return updated;
};

export const deleteEstado = async (idEstado) =>
  db(TABLE).where({ idEstado }).del();
