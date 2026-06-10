import * as estadoService from "../services/estado.service.js";

export const getEstados = async (req, res) => {
  try {
    const estados = await estadoService.getEstados();
    res.json({ estados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEstadoById = async (req, res) => {
  try {
    const estado = await estadoService.getEstadoById(req.params.id);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    res.json({ estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEstado = async (req, res) => {
  try {
    const estado = await estadoService.createEstado(req.body);
    res.status(201).json({ estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEstado = async (req, res) => {
  try {
    const estado = await estadoService.updateEstado(req.params.id, req.body);
    if (!estado) return res.status(404).json({ error: "Estado no encontrado" });
    res.json({ estado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEstado = async (req, res) => {
  try {
    await estadoService.deleteEstado(req.params.id);
    res.json({ message: "Estado eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
