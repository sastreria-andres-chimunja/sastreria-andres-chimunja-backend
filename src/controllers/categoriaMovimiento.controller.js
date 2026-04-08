import * as categoriaMovimientoService from "../services/categoriaMovimiento.service.js";

export const getCategoriaMovimientoById = async (req, res) => {
  try {
    const categoriaMovimiento =
      await categoriaMovimientoService.getCategoriaMovimientoById(
        req.params.id,
      );
    res.json({ categoriaMovimiento });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getCategoriaMovimientoByName = async (req, res) => {
  try {
    const categoriaMovimiento =
      await categoriaMovimientoService.getCategoriaMovimientoByName(
        req.params.id,
      );
    res.json({ categoriaMovimiento });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getCategoriasMovimiento = async (req, res) => {
  try {
    const categoriasMovimiento =
      await categoriaMovimientoService.getCategoriasMovimiento();
    res.json({ categoriasMovimiento });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createCategoriaMovimiento = async (req, res) => {
  try {
    const categoriaMovimiento =
      await categoriaMovimientoService.createCategoriaMovimiento(req.body);
    res.json({ categoriaMovimiento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCategoriaMovimiento = async (req, res) => {
  try {
    const categoriaMovimiento =
      await categoriaMovimientoService.updateCategoriaMovimiento(
        req.params.id,
        req.body,
      );

    res.json({ categoriaMovimiento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCategoriaMovimiento = async (req, res) => {
  try {
    await categoriaMovimientoService.deleteCategoriaMovimiento(req.params.id);

    res.json({
      message: "Categoria de movimiento eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
