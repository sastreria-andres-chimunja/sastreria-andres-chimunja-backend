import * as itemPedidoRepository from "../repositories/itemPedido.repository.js";

export const getItemsPedido = async (idPedido, fechaInicio, fechaFin) =>
  itemPedidoRepository.getItemsPedido(idPedido, fechaInicio, fechaFin);

export const getItemPedidoById = async (idItemPedido) =>
  itemPedidoRepository.getItemPedidoById(idItemPedido);

export const createItemPedido = async (data) =>
  itemPedidoRepository.createItemPedido(data);

export const updateItemPedido = async (idItemPedido, data) =>
  itemPedidoRepository.updateItemPedido(idItemPedido, data);

export const deleteItemPedido = async (idItemPedido) =>
  itemPedidoRepository.deleteItemPedido(idItemPedido);

export const pagarItemPedido = async (idItemPedido) =>
  itemPedidoRepository.pagarItemPedido(idItemPedido);
