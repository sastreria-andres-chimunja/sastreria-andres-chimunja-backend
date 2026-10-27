import * as movimientoRepository from "../repositories/movimiento.repository.js";
import * as pedidoRepository from "../repositories/pedido.repository.js";

export const getMovimientoById = async (idMovimiento) => {
  const movimiento = await movimientoRepository.getMovimientoById(idMovimiento);
  return movimiento;
};

export const getMovimientos = async (fechaInicio, fechaFin, categoria) => {
  return movimientoRepository.getMovimientos(fechaInicio, fechaFin, categoria);
};

export const getBalanceDia = async (fecha) => {
  return movimientoRepository.getBalanceDia(fecha);
};

export const createMovimiento = async (data) => {
  return movimientoRepository.createMovimiento(data);
};

export const updateMovimiento = async (id, data) => {
  return movimientoRepository.updateMovimiento(id, data);
};

export const deleteMovimiento = async (id) => {
  return movimientoRepository.deleteMovimiento(id);
};

export const getCreditosPendientes = async () => {
  return movimientoRepository.getCreditosPendientes();
};

export const pagarCredito = async (id, idMetodoPago) => {
  return movimientoRepository.pagarCredito(id, idMetodoPago);
};

/**
 * Reversa un crédito que todavía NO se ha pagado (p. ej. se eligió
 * "Crédito" por error al entregar):
 * - Si salió de una entrega (abono automático, autoGenerado=true): se
 *   revierte el pedido de Entregado a Terminado -- el mismo "Revertir" de
 *   la Hoja de trabajo, que borra ese abono y deja el saldo pendiente para
 *   volver a entregarlo con el método correcto.
 * - Si es un abono manual con método Crédito: solo se borra ese movimiento.
 */
export const reversarCredito = async (id) => {
  const mov = await movimientoRepository.getMovimientoById(id);
  if (!mov) throw new Error("Movimiento no encontrado.");
  if (!mov.esCredito) throw new Error("Este movimiento no es un crédito.");
  if (mov.creditoPagado) throw new Error("Este crédito ya fue pagado -- elimina primero el movimiento de su pago.");

  if (mov.autoGenerado && mov.tipoReferencia === "pedido") {
    await pedidoRepository.revertirEstadoPedido(mov.idReferencia);
    return { revertidoPedido: true, idPedido: mov.idReferencia };
  }
  await movimientoRepository.deleteMovimiento(id);
  return { revertidoPedido: false };
};
