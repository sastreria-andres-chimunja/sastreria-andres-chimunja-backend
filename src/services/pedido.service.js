import * as pedidoRepository from "../repositories/pedido.repository.js";

export const getPedidos = async (fechaInicio, fechaFin) =>
  pedidoRepository.getPedidos(fechaInicio, fechaFin);

export const getPedidoById = async (idPedido) =>
  pedidoRepository.getPedidoById(idPedido);

export const createPedido = async (data) =>
  pedidoRepository.createPedido(data);

export const updatePedido = async (idPedido, data) =>
  pedidoRepository.updatePedido(idPedido, data);

export const deletePedido = async (idPedido) =>
  pedidoRepository.deletePedido(idPedido);
