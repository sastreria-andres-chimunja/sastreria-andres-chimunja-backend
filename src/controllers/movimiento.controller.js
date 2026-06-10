import * as movimientoService from "../services/movimiento.service.js";

export const getMovimientoById = async (req, res) => {
  try {
    const movimiento = await movimientoService.getMovimientoById(req.params.id);
    res.json({ movimiento });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getMovimientos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const movimientos = await movimientoService.getMovimientos(fechaInicio, fechaFin);
    res.json({ movimientos });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createMovimiento = async (req, res) => {
  try {
    const movimiento = await movimientoService.createMovimiento(req.body);
    res.json({ movimiento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMovimiento = async (req, res) => {
  try {
    const movimiento = await movimientoService.updateMovimiento(
      req.params.id,
      req.body,
    );

    res.json({ movimiento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMovimiento = async (req, res) => {
  try {
    await movimientoService.deleteMovimiento(req.params.id);

    res.json({
      message: "Movimiento eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
