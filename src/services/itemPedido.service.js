import * as itemPedidoRepository from "../repositories/itemPedido.repository.js";

export const getItemsPedido = async (idPedido, fechaInicio, fechaFin, idEmpleado) =>
  itemPedidoRepository.getItemsPedido(idPedido, fechaInicio, fechaFin, idEmpleado);

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

export const getPagosItem = async (idItemPedido) =>
  itemPedidoRepository.getPagosItem(idItemPedido);

export const registrarPago = async (idItemPedido, pagoData) =>
  itemPedidoRepository.registrarPago(idItemPedido, pagoData);

export const cambiarEstadoItem = async (idItemPedido, idEstado) =>
  itemPedidoRepository.cambiarEstadoItem(idItemPedido, idEstado);

export const cambiarComisionItem = async (idItemPedido, comisionEmpleado) =>
  itemPedidoRepository.cambiarComisionItem(idItemPedido, comisionEmpleado);
