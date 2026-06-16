import db from "../config/database.js";

const TABLE = "auth";

export const createAuth = async (idEmpleado, claveHash, username) => {
  const [newAuth] = await db(TABLE)
    .insert({ idEmpleado, clave: claveHash, username, debeCambiarClave: true })
    .returning("*");
  return newAuth;
};

export const getAuthByEmpleado = async (idEmpleado) => {
  return db(TABLE).where({ idEmpleado }).first();
};

export const getAuthByUsername = async (username) => {
  return db(TABLE).where({ username }).first();
};

export const updateClave = async (idEmpleado, claveHash, debeCambiarClave = false) => {
  const [updated] = await db(TABLE)
    .where({ idEmpleado })
    .update({ clave: claveHash, debeCambiarClave })
    .returning("*");
  return updated;
};
