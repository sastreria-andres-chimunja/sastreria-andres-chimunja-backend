import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as authRepository from "../repositories/auth.repository.js";
import { getEmpleadoById } from "../repositories/empleado.repository.js";

const SALT_ROUNDS = 10;

const generarClaveAleatoria = (longitud = 8) => {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let clave = "";
  for (let i = 0; i < longitud; i++) {
    clave += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return clave;
};

export const crearAuth = async (idEmpleado, username) => {
  const claveTextoPlano = generarClaveAleatoria();
  const claveHash = await bcrypt.hash(claveTextoPlano, SALT_ROUNDS);
  await authRepository.createAuth(idEmpleado, claveHash, username);
  return claveTextoPlano;
};

export const login = async (username, clave) => {
  const registro = await authRepository.getAuthByUsername(username);
  if (!registro) {
    throw new Error("Credenciales inválidas");
  }

  const claveValida = await bcrypt.compare(clave, registro.clave);
  if (!claveValida) {
    throw new Error("Credenciales inválidas");
  }

  const token = jwt.sign(
    { idEmpleado: registro.idEmpleado },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  const empleado = await getEmpleadoById(registro.idEmpleado);

  return { token, empleado };
};

export const actualizarClave = async (idEmpleado, claveActual, claveNueva) => {
  const registro = await authRepository.getAuthByEmpleado(idEmpleado);
  if (!registro) {
    throw new Error("Empleado no encontrado");
  }

  const claveValida = await bcrypt.compare(claveActual, registro.clave);
  if (!claveValida) {
    throw new Error("La clave actual es incorrecta");
  }

  const claveHash = await bcrypt.hash(claveNueva, SALT_ROUNDS);
  await authRepository.updateClave(idEmpleado, claveHash);
};
