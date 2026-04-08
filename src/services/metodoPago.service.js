import * as metodoPagoRepository from "../repositories/metodoPago.repository.js";

export const getMetodoPagoById = async (idMetodoPago) => {
  const metodoPago = await metodoPagoRepository.getMetodoPagoById(idMetodoPago);

  return metodoPago;
};

export const getMetodosPagos = async () => {
  const metodoPagos = await metodoPagoRepository.getMetodos();

  return metodoPagos;
};

export const createMetodoPago = async (data) => {
  return metodoPagoRepository.createMetodoPago(data);
};

export const updateMetodoPago = async (id, data) => {
  return metodoPagoRepository.updateMetodoPago(id, data);
};

export const deleteMetodoPago = async (id) => {
  return metodoPagoRepository.deleteMetodoPago(id);
};
