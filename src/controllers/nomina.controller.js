import * as nominaService from "../services/nomina.service.js";

export const getNominaEmpleado = async (req, res) => {
  try {
    const { idEmpleado } = req.params;
    const { fechaInicio, fechaFin, historial } = req.query;
    const nominaEmpleado = await nominaService.getNominaByEmpleado(
      Number(idEmpleado),
      fechaInicio,
      fechaFin,
      historial === "true"
    );
    if (!nominaEmpleado) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }
    res.json({ nominaEmpleado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNominaGeneral = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const nominaGeneral = await nominaService.getNominaGeneral(fechaInicio, fechaFin);
    res.json({ nominaGeneral });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const liquidarNomina = async (req, res) => {
  try {
    const { idEmpleado } = req.params;
    const resultado = await nominaService.liquidarNomina(Number(idEmpleado));
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
