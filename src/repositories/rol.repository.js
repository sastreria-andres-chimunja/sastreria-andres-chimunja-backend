import db from "../config/database.js";

const TABLE = "rol";

export const getRolById = async (idRol) => {
  return db(TABLE).where({ idRol }).first();
};
export const getRolByName = async (nombre) => {
  return db(TABLE).where({ nombre });
};
export const getRoles = async () => {
  return db(TABLE);
};

export const createRol = async (rol) => {
  const [newRol] = await db(TABLE).insert(rol).returning("*");

  return newRol;
};

export const updateRol = async (idRol, rol) => {
  const [updated] = await db(TABLE).where({ idRol }).update(rol).returning("*");

  return updated;
};

export const deleteRol = async (idRol) => {
  return db(TABLE).where({ idRol }).del();
};
