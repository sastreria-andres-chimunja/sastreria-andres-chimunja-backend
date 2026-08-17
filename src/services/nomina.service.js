import * as nominaRepository from "../repositories/nomina.repository.js";

export const getNominaByEmpleado = async (idEmpleado, fechaInicio, fechaFin, historial = false) => {
  return nominaRepository.getNominaEmpleado(idEmpleado, fechaInicio, fechaFin, historial);
};

export const getNominaGeneral = async (fechaInicio, fechaFin) => {
  return nominaRepository.getNominaResumenTodos(fechaInicio, fechaFin);
};

export const liquidarNomina = async (idEmpleado) => {
  return nominaRepository.liquidarNomina(idEmpleado);
};

export const getResumenPeriodo = async (idEmpleado, fechaInicio, fechaFin) => {
  return nominaRepository.getResumenPeriodo(idEmpleado, fechaInicio, fechaFin);
};
