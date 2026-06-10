import * as nominaRepository from "../repositories/nomina.repository.js";

export const getNominaByEmpleado = async (idEmpleado, fechaInicio, fechaFin) => {
  return nominaRepository.getNominaEmpleado(idEmpleado, fechaInicio, fechaFin);
};

export const getNominaGeneral = async (fechaInicio, fechaFin) => {
  return nominaRepository.getNominaResumenTodos(fechaInicio, fechaFin);
};
