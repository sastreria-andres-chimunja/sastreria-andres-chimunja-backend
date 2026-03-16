import * as medidaRepository from "../repositories/medida.repository.js";

export const getMedidasByClienteId = async (idCliente) => {
  const medidas = await medidaRepository.getMedidasByClientId(idCliente);

  return medidas;
};
export const getMedidaById = async (idMedida) => {
  const medida = await medidaRepository.getMedidaById(idMedida);

  return medida;
};

export const createMedida = async (data) => {
  return medidaRepository.createMedida(data);
};

export const updateMedida = async (id, data) => {
  return medidaRepository.updateMedida(id, data);
};

export const deleteMedida = async (id) => {
  return medidaRepository.deleteMedida(id);
};
