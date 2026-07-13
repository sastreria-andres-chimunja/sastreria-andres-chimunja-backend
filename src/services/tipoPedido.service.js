import * as tipoPedidoRepository from "../repositories/tipoPedido.repository.js";

export const getTiposPedido = async () => tipoPedidoRepository.getTiposPedido();

export const getTipoPedidoById = async (idTipoPedido) =>
  tipoPedidoRepository.getTipoPedidoById(idTipoPedido);
