import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "empleado";

const formatEmpleado = (emp) =>
  emp ? { ...emp, fechaCumpleanios: formatFecha(emp.fechaCumpleanios) } : null;

const WITH_ROL = () =>
  db(TABLE)
    .leftJoin('rol as r', 'r.idRol', `${TABLE}.idRol`)
    .select(`${TABLE}.*`, 'r.nombre as nombreRol');

export const getEmpleadoById = async (idEmpleado) => {
  const emp = await WITH_ROL().where({ [`${TABLE}.idEmpleado`]: idEmpleado }).first();
  return formatEmpleado(emp);
};

export const getEmpleados = async () => {
  const emps = await WITH_ROL().orderBy(`${TABLE}.idEmpleado`);
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
  const { nombres, apellidos, telefono, direccion, idRol, fechaCumpleanios } = empleado;
  const data = { nombres, apellidos, telefono, direccion, idRol, fechaCumpleanios: parseFecha(fechaCumpleanios) };
  const [updated] = await db(TABLE)
    .where({ idEmpleado })
    .update(data)
    .returning("*");
  return formatEmpleado(updated);
};

export const deleteEmpleado = async (idEmpleado) => {
  return db(TABLE).where({ idEmpleado }).del();
};

export const cambiarEstadoEmpleado = async (idEmpleado, activo) => {
  await db(TABLE).where({ idEmpleado }).update({ activo });
  return getEmpleadoById(idEmpleado);
};
