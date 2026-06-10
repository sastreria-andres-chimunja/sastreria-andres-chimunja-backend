import * as tipoMovimientoService from "../services/tipoMovimiento.service.js";

export const getTipoMovimientoById = async (req, res) => {
  try {
    const tipoMovimiento = await tipoMovimientoService.getTipoMovimientoById(
      req.params.id,
    );
    res.json({ tipoMovimiento });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getTipoMovimientoByName = async (req, res) => {
  try {
    const tipoMovimiento = await tipoMovimientoService.getTipoMovimientoByName(
      req.params.id,
    );
    res.json({ tipoMovimiento });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getTiposMovimiento = async (req, res) => {
  try {
    const tiposMovimiento = await tipoMovimientoService.getTiposMovimiento();
    res.json({ tiposMovimiento });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createTipoMovimiento = async (req, res) => {
  try {
    const tipoMovimiento = await tipoMovimientoService.createTipoMovimiento(
      req.body,
    );
    res.json({ tipoMovimiento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTipoMovimiento = async (req, res) => {
  try {
    const tipoMovimiento = await tipoMovimientoService.updateTipoMovimiento(
      req.params.id,
      req.body,
    );

    res.json({ tipoMovimiento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTipoMovimiento = async (req, res) => {
  try {
    await tipoMovimientoService.deleteTipoMovimiento(req.params.id);

    res.json({
      message: "Tipo de movimiento eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
