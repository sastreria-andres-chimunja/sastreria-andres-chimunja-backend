import * as movimientoRepository from "../repositories/movimiento.repository.js";

export const getMovimientoById = async (idMovimiento) => {
  const movimiento = await movimientoRepository.getMovimientoById(idMovimiento);
  return movimiento;
};

export const getMovimientos = async (fechaInicio, fechaFin, categoria) => {
  return movimientoRepository.getMovimientos(fechaInicio, fechaFin, categoria);
};

export const createMovimiento = async (data) => {
  return movimientoRepository.createMovimiento(data);
};

export const updateMovimiento = async (id, data) => {
  return movimientoRepository.updateMovimiento(id, data);
};

export const deleteMovimiento = async (id) => {
  return movimientoRepository.deleteMovimiento(id);
};
