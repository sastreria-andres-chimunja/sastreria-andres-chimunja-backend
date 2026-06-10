import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "empleado";

const formatEmpleado = (emp) =>
  emp ? { ...emp, fechaCumpleanios: formatFecha(emp.fechaCumpleanios) } : null;

export const getEmpleadoById = async (idEmpleado) => {
  const emp = await db(TABLE).where({ idEmpleado }).first();
  return formatEmpleado(emp);
};

export const getEmpleados = async () => {
  const emps = await db(TABLE);
  return emps.map(formatEmpleado);
};

export const createEmpleado = async (empleado) => {
  const data = {
    ...empleado,
    fechaCumpleanios: parseFecha(empleado.fechaCumpleanios),
  };
  const [newEmpleado] = await db(TABLE).insert(data).returning("*");
  return formatEmpleado(newEmpleado);
};

export const updateEmpleado = async (idEmpleado, empleado) => {
  const data = {
    ...empleado,
    fechaCumpleanios: parseFecha(empleado.fechaCumpleanios),
  };
  const [updated] = await db(TABLE)
    .where({ idEmpleado })
    .update(data)
    .returning("*");
  return formatEmpleado(updated);
};

export const deleteEmpleado = async (idEmpleado) => {
  return db(TABLE).where({ idEmpleado }).del();
};
