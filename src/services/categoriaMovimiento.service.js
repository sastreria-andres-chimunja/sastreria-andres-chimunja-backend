import * as categoriaMovimientoRepository from "../repositories/categoriaMovimiento.repository.js";

export const getCategoriaMovimientoById = async (idCategoriaMovimiento) => {
  const categoriaMovimiento =
    await categoriaMovimientoRepository.getCategoriaMovimientoById(
      idCategoriaMovimiento,
    );

  return categoriaMovimiento;
};
export const getCategoriaMovimientoByName = async (
  nombreCategoriaMovimiento,
) => {
  const categoriaMovimiento =
    await categoriaMovimientoRepository.getCategoriaMovimientoByName(
      nombreCategoriaMovimiento,
    );

  return categoriaMovimiento;
};
export const getCategoriasMovimiento = async () => {
  const categoriasMovimiento =
    await categoriaMovimientoRepository.getCategoriasMovimiento();

  return categoriasMovimiento;
};

export const createCategoriaMovimiento = async (data) => {
  return categoriaMovimientoRepository.createCategoriaMovimiento(data);
};

export const updateCategoriaMovimiento = async (id, data) => {
  return categoriaMovimientoRepository.updateCategoriaMovimiento(id, data);
};

export const deleteCategoriaMovimiento = async (id) => {
  return categoriaMovimientoRepository.deleteCategoriaMovimiento(id);
};
