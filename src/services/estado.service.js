import * as estadoRepository from "../repositories/estado.repository.js";

export const getEstados = async () => estadoRepository.getEstados();

export const getEstadoById = async (idEstado) =>
  estadoRepository.getEstadoById(idEstado);

export const createEstado = async (data) =>
  estadoRepository.createEstado(data);

export const updateEstado = async (idEstado, data) =>
  estadoRepository.updateEstado(idEstado, data);

export const deleteEstado = async (idEstado) =>
  estadoRepository.deleteEstado(idEstado);
