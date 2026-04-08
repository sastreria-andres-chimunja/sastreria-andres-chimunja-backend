import * as rolRepository from "../repositories/rol.repository.js";

export const getRolById = async (idRol) => {
  const rol = await rolRepository.getRolById(idRol);

  return rol;
};
export const getRolByName = async (nombre) => {
  const rol = await rolRepository.getRolByName(nombre);

  return rol;
};
export const getRoles = async () => {
  const roles = await rolRepository.getRoles();

  return roles;
};

export const createRol = async (data) => {
  return rolRepository.createRol(data);
};

export const updateRol = async (id, data) => {
  return rolRepository.updateRol(id, data);
};

export const deleteRol = async (id) => {
  return rolRepository.deleteRol(id);
};
