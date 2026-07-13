import * as empleadoService from "../services/empleado.service.js";

export const getEmpleadoById = async (req, res) => {
  try {
    const empleado = await empleadoService.getEmpleadoById(req.params.id);
    res.json({ empleado });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
export const getEmpleados = async (req, res) => {
  try {
    const empleados = await empleadoService.getEmpleados();
    res.json({ empleados });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const createEmpleado = async (req, res) => {
  try {
    const { empleado, clave } = await empleadoService.createEmpleado(req.body);
    res.json({ empleado, clave });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmpleado = async (req, res) => {
  try {
    const empleado = await empleadoService.updateEmpleado(
      req.params.id,
      req.body,
    );

    res.json({ empleado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmpleado = async (req, res) => {
  try {
    await empleadoService.deleteEmpleado(req.params.id);

    res.json({
      message: "Empleado eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cambiarEstadoEmpleado = async (req, res) => {
  try {
    const empleado = await empleadoService.cambiarEstadoEmpleado(
      req.params.id,
      req.body.activo,
    );
    res.json({ empleado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
