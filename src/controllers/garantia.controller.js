import * as garantiaService from "../services/garantia.service.js";

export const createGarantia = async (req, res) => {
  try {
    const { idEmpleado, nombreCliente, valor } = req.body;
    if (!idEmpleado || !nombreCliente || valor == null) {
      return res.status(400).json({ error: "Falta idEmpleado, nombreCliente o valor." });
    }
    const garantia = await garantiaService.createGarantia(idEmpleado, nombreCliente, valor);
    res.json({ garantia });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listarGarantias = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, idEmpleado } = req.query;
    const garantias = await garantiaService.listarGarantias(fechaInicio, fechaFin, idEmpleado);
    res.json({ garantias });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarComisionGarantia = async (req, res) => {
  try {
    const { comisionEmpleado } = req.body;
    const garantia = await garantiaService.actualizarComisionGarantia(req.params.id, comisionEmpleado);
    res.json({ garantia });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
