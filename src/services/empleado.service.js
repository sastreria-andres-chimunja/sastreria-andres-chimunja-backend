import * as empleadoRepository from "../repositories/empleado.repository.js";

export const getEmpleadoById = async (idEmpleado) => {
  const empleado = await empleadoRepository.getEmpleadoById(idEmpleado);

  return empleado;
};
export const getEmpleados = async () => {
  const empleados = await empleadoRepository.getEmpleados();

  return empleados;
};

export const createEmpleado = async (data) => {
  return empleadoRepository.createEmpleado(data);
};

export const updateEmpleado = async (id, data) => {
  return empleadoRepository.updateEmpleado(id, data);
};

export const deleteEmpleado = async (id) => {
  return empleadoRepository.deleteEmpleado(id);
};
