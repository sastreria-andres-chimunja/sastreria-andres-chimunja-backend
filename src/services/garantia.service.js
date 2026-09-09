import * as garantiaRepository from "../repositories/garantia.repository.js";

export const createGarantia = async (idEmpleado, nombreCliente, valor) => {
  return garantiaRepository.createGarantia(idEmpleado, nombreCliente, valor);
};

export const listarGarantias = async (fechaInicio, fechaFin, idEmpleado) => {
  return garantiaRepository.listarGarantias(fechaInicio, fechaFin, idEmpleado);
};
