import db from "../config/database.js";

const TABLE = "empleado";

export const getEmpleadoById = async (idEmpleado) => {
  return db(TABLE).where({ idEmpleado }).first();
};
export const getEmpleados = async () => {
  return db(TABLE);
};

export const createEmpleado = async (empleado) => {
  const [newEmpleado] = await db(TABLE).insert(empleado).returning("*");

  return newEmpleado;
};

export const updateEmpleado = async (idEmpleado, empleado) => {
  const [updated] = await db(TABLE)
    .where({ idEmpleado })
    .update(empleado)
    .returning("*");

  return updated;
};

export const deleteEmpleado = async (idEmpleado) => {
  return db(TABLE).where({ idEmpleado }).del();
};
