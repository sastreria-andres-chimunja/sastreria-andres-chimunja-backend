import * as metodoPagoService from "../services/metodoPago.service.js";

export const getMetodoPagoById = async (req, res) => {
  try {
    const metodoPago = await metodoPagoService.getMetodoPagoById(req.params.id);
    res.json({ metodoPago });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getMetodosPago = async (req, res) => {
  try {
    const metodosPago = await metodoPagoService.getMetodosPagos();
    res.json({ metodosPago });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createMetodoPago = async (req, res) => {
  try {
    const metodoPago = await metodoPagoService.createMetodoPago(req.body);
    res.json({ metodoPago });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMetodoPago = async (req, res) => {
  try {
    const metodoPago = await metodoPagoService.updateMetodoPago(
      req.params.id,
      req.body,
    );

    res.json({ metodoPago });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMetodoPago = async (req, res) => {
  try {
    await metodoPagoService.deleteMetodoPago(req.params.id);

    res.json({
      message: "Método de pago eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
