import * as imagenRepository from "../repositories/imagenes.repository.js";

export const getImagenesByReferencia = async (tipoReferencia, idReferencia) => {
  return imagenRepository.getImagenesByReferencia(tipoReferencia, idReferencia);
};

export const getImagenById = async (id) => {
  return imagenRepository.getImagenById(id);
};

export const createImagen = async (data) => {
  return imagenRepository.createImagen(data);
};

export const deleteImagen = async (id) => {
  return imagenRepository.deleteImagen(id);
};
