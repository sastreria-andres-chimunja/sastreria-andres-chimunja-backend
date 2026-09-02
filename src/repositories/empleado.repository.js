import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";
import { mayus } from "../utils/text.utils.js";

const TABLE = "empleado";

const formatEmpleado = (emp) =>
  emp ? { ...emp, fechaCumpleanios: formatFecha(emp.fechaCumpleanios) } : null;

const WITH_ROL = () =>
  db(TABLE)
    .leftJoin('rol as r', 'r.idRol', `${TABLE}.idRol`)
    .leftJoin('auth as a', 'a.idEmpleado', `${TABLE}.idEmpleado`)
    .select(`${TABLE}.*`, 'r.nombre as nombreRol', 'a.username as username');

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
    nombres: mayus(empleado.nombres),
    apellidos: mayus(empleado.apellidos),
    direccion: mayus(empleado.direccion),
    fechaCumpleanios: parseFecha(empleado.fechaCumpleanios),
  };
  const [newEmpleado] = await db(TABLE).insert(data).returning("*");
  return formatEmpleado(newEmpleado);
};

export const updateEmpleado = async (idEmpleado, empleado) => {
  const { nombres, apellidos, telefono, direccion, idRol, fechaCumpleanios } = empleado;
  const data = {
    nombres: mayus(nombres), apellidos: mayus(apellidos), telefono, direccion: mayus(direccion),
    idRol, fechaCumpleanios: parseFecha(fechaCumpleanios),
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

export const cambiarEstadoEmpleado = async (idEmpleado, activo) => {
  await db(TABLE).where({ idEmpleado }).update({ activo });
  return getEmpleadoById(idEmpleado);
};
