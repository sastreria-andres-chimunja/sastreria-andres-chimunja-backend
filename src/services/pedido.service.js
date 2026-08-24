import * as pedidoRepository from "../repositories/pedido.repository.js";

export const getPedidos = async (fechaInicio, fechaFin, idEmpleado) =>
  pedidoRepository.getPedidos(fechaInicio, fechaFin, idEmpleado);

export const getPedidoById = async (idPedido) =>
  pedidoRepository.getPedidoById(idPedido);

export const createPedido = async (data) =>
  pedidoRepository.createPedido(data);

export const updatePedido = async (idPedido, data) =>
  pedidoRepository.updatePedido(idPedido, data);

export const deletePedido = async (idPedido) =>
  pedidoRepository.deletePedido(idPedido);

export const getAbonosPedido = async (idPedido) =>
  pedidoRepository.getAbonosPedido(idPedido);

export const registrarAbonoPedido = async (idPedido, data) =>
  pedidoRepository.registrarAbonoPedido(idPedido, data);

export const getValorProgramado = async (fechaEntrega, excluirIdPedido) =>
  pedidoRepository.getValorProgramado(fechaEntrega, excluirIdPedido);

export const revertirPedidoEntregado = async (idPedido) =>
  pedidoRepository.revertirPedidoEntregado(idPedido);
