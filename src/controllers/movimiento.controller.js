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
    const { fechaInicio, fechaFin, categoria } = req.query;
    const movimientos = await movimientoService.getMovimientos(fechaInicio, fechaFin, categoria);
    res.json({ movimientos });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getBalanceDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: "Falta el parámetro 'fecha'" });
    const balance = await movimientoService.getBalanceDia(fecha);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

export const getCreditosPendientes = async (req, res) => {
  try {
    const creditos = await movimientoService.getCreditosPendientes();
    res.json({ creditos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const pagarCredito = async (req, res) => {
  try {
    const { idMetodoPago } = req.body;
    if (!idMetodoPago) return res.status(400).json({ error: "Falta idMetodoPago." });
    const movimiento = await movimientoService.pagarCredito(req.params.id, idMetodoPago);
    res.json({ movimiento });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
