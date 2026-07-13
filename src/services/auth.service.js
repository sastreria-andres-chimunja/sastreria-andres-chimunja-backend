import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as authRepository from "../repositories/auth.repository.js";
import { getEmpleadoById } from "../repositories/empleado.repository.js";

const SALT_ROUNDS = 10;

export const generarClaveAleatoria = () => {
  const digits = "0123456789";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letters = upper + lower;

  // Garantiza: 4 dígitos, 1 mayúscula fija, 3 letras adicionales (upper+lower)
  const chars = [
    ...Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * digits.length)]),
    upper[Math.floor(Math.random() * upper.length)],
    ...Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]),
  ];

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};

export const crearAuth = async (idEmpleado, username) => {
  const claveTextoPlano = generarClaveAleatoria();
  const claveHash = await bcrypt.hash(claveTextoPlano, SALT_ROUNDS);
  await authRepository.createAuth(idEmpleado, claveHash, username);
  return claveTextoPlano;
};

export const login = async (username, clave) => {
  const registro = await authRepository.getAuthByUsername(username);
  if (!registro) throw new Error("Credenciales inválidas");

  const claveValida = await bcrypt.compare(clave, registro.clave);
  if (!claveValida) throw new Error("Credenciales inválidas");

  const token = jwt.sign(
    { idEmpleado: registro.idEmpleado },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  const empleado = await getEmpleadoById(registro.idEmpleado);

  if (empleado.activo === false) {
    throw new Error("Tu usuario está inactivo. Contacta al administrador.");
  }

  return { token, empleado, debeCambiarClave: registro.debeCambiarClave };
};

export const actualizarClave = async (idEmpleado, claveActual, claveNueva) => {
  const registro = await authRepository.getAuthByEmpleado(idEmpleado);
  if (!registro) throw new Error("Empleado no encontrado");

  const claveValida = await bcrypt.compare(claveActual, registro.clave);
  if (!claveValida) throw new Error("La clave actual es incorrecta");

  const claveHash = await bcrypt.hash(claveNueva, SALT_ROUNDS);
  await authRepository.updateClave(idEmpleado, claveHash, false);
};

export const cambiarClaveInicial = async (idEmpleado, claveNueva) => {
  const registro = await authRepository.getAuthByEmpleado(idEmpleado);
  if (!registro) throw new Error("Empleado no encontrado");

  const claveHash = await bcrypt.hash(claveNueva, SALT_ROUNDS);
  await authRepository.updateClave(idEmpleado, claveHash, false);
};

export const recuperarClave = async (username) => {
  const registro = await authRepository.getAuthByUsername(username);
  if (!registro) throw new Error("Usuario no encontrado");

  const empleado = await getEmpleadoById(registro.idEmpleado);
  const claveTextoPlano = generarClaveAleatoria();
  const claveHash = await bcrypt.hash(claveTextoPlano, SALT_ROUNDS);
  await authRepository.updateClave(registro.idEmpleado, claveHash, true);

  return {
    claveTemp: claveTextoPlano,
    telefono: empleado?.telefono ?? '',
    nombre: `${empleado?.nombres ?? ''} ${empleado?.apellidos ?? ''}`.trim(),
  };
};
