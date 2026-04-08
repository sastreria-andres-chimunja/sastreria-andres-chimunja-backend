import * as tipoMovimientoRepository from "../repositories/tipoMovimiento.repository.js";

export const getTipoMovimientoById = async (idTipoMovimiento) => {
  const tipoMovimiento =
    await tipoMovimientoRepository.getTipoMovimientoById(idTipoMovimiento);

  return tipoMovimiento;
};
export const getTipoMovimientoByName = async (nombreTipoMovimiento) => {
  const tipoMovimiento =
    await tipoMovimientoRepository.getTipoMovimientoByName(
      nombreTipoMovimiento,
    );

  return tipoMovimiento;
};
export const getTiposMovimiento = async () => {
  const tiposMovimiento = await tipoMovimientoRepository.getTiposMovimiento();

  return tiposMovimiento;
};

export const createTipoMovimiento = async (data) => {
  return tipoMovimientoRepository.createTipoMovimiento(data);
};

export const updateTipoMovimiento = async (id, data) => {
  return tipoMovimientoRepository.updateTipoMovimiento(id, data);
};

export const deleteTipoMovimiento = async (id) => {
  return tipoMovimientoRepository.deleteTipoMovimiento(id);
};
