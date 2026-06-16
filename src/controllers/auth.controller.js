import * as authService from "../services/auth.service.js";

export const recuperarClave = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "username es requerido" });

    const result = await authService.recuperarClave(username);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, clave } = req.body;
    if (!username || !clave) {
      return res.status(400).json({ error: "username y clave son requeridos" });
    }

    const { token, empleado, debeCambiarClave } = await authService.login(username, clave);
    res.json({ token, empleado, debeCambiarClave });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const actualizarClave = async (req, res) => {
  try {
    const { idEmpleado, claveActual, claveNueva } = req.body;
    if (!idEmpleado || !claveActual || !claveNueva) {
      return res.status(400).json({ error: "idEmpleado, claveActual y claveNueva son requeridos" });
    }

    await authService.actualizarClave(idEmpleado, claveActual, claveNueva);
    res.json({ message: "Clave actualizada correctamente" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const cambiarClaveInicial = async (req, res) => {
  try {
    const { idEmpleado, claveNueva } = req.body;
    if (!idEmpleado || !claveNueva) {
      return res.status(400).json({ error: "idEmpleado y claveNueva son requeridos" });
    }

    await authService.cambiarClaveInicial(idEmpleado, claveNueva);
    res.json({ message: "Clave actualizada correctamente" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
