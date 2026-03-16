import * as medidaService from "../services/medida.service.js";

export const getMedidaById = async (req, res) => {
  try {
    const medida = await medidaService.getMedidaById(req.params.id);
    res.json({ medida });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getMedidasByClientId = async (req, res) => {
  try {
    const medidas = await medidaService.getMedidasByClienteId(req.params.id);
    res.json({ medidas });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createMedida = async (req, res) => {
  try {
    const medida = await medidaService.createMedida(req.body);
    res.json({ medida });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMedida = async (req, res) => {
  try {
    const Medida = await medidaService.updateMedida(req.params.id, req.body);

    res.json({ Medida });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedida = async (req, res) => {
  try {
    await medidaService.deleteMedida(req.params.id);

    res.json({
      message: "Medida eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
