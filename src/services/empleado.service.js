import * as empleadoRepository from "../repositories/empleado.repository.js";
import { crearAuth } from "./auth.service.js";

export const getEmpleadoById = async (idEmpleado) => {
  const empleado = await empleadoRepository.getEmpleadoById(idEmpleado);
  return empleado;
};

export const getEmpleados = async () => {
  const empleados = await empleadoRepository.getEmpleados();
  return empleados;
};

const generarUsername = (nombres = '', apellidos = '') => {
  const normalizar = (s) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  const primerNombre = normalizar(nombres.trim().split(/\s+/)[0]);
  const primerApellido = normalizar(apellidos.trim().split(/\s+/)[0]);
  return `${primerNombre}${primerApellido}`;
};

export const createEmpleado = async (data) => {
  const empleado = await empleadoRepository.createEmpleado(data);
  const username = generarUsername(data.nombres, data.apellidos);
  const clave = await crearAuth(empleado.idEmpleado, username);
  return { empleado, clave };
};

export const updateEmpleado = async (id, data) => {
  return empleadoRepository.updateEmpleado(id, data);
};

export const deleteEmpleado = async (id) => {
  return empleadoRepository.deleteEmpleado(id);
};

export const cambiarEstadoEmpleado = async (id, activo) => {
  return empleadoRepository.cambiarEstadoEmpleado(id, activo);
};
