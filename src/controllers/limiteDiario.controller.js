import * as limiteDiarioService from "../services/limiteDiario.service.js";

export const getLimiteDiario = async (req, res) => {
  try {
    const limiteDiario = await limiteDiarioService.getLimiteDiario();
    res.json({ limiteDiario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLimiteDiario = async (req, res) => {
  try {
    const { monto } = req.body;
    if (monto == null || Number(monto) < 0) {
      return res.status(400).json({ error: "El monto debe ser un número válido mayor o igual a 0" });
    }
    const limiteDiario = await limiteDiarioService.updateLimiteDiario(monto);
    res.json({ limiteDiario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
