import * as rolService from "../services/rol.service.js";

export const getRolById = async (req, res) => {
  try {
    const rol = await rolService.getRolById(req.params.id);
    res.json({ rol });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getRolByName = async (req, res) => {
  try {
    const rol = await rolService.getRolByName(req.params.id);
    res.json({ rol });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getRoles = async (req, res) => {
  try {
    const roles = await rolService.getRoles();
    res.json({ roles });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createRol = async (req, res) => {
  try {
    const rol = await rolService.createRol(req.body);
    res.json({ rol });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRol = async (req, res) => {
  try {
    const rol = await rolService.updateRol(req.params.id, req.body);

    res.json({ rol });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRol = async (req, res) => {
  try {
    await rolService.deleteRol(req.params.id);

    res.json({
      message: "Rol eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
