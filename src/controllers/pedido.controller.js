import * as pedidoService from "../services/pedido.service.js";
import * as itemPedidoService from "../services/itemPedido.service.js";
import { verificarTokenPedido } from "../utils/pedidoToken.utils.js";

export const getPedidos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, idEmpleado } = req.query;
    const pedidos = await pedidoService.getPedidos(
      fechaInicio, fechaFin,
      idEmpleado ? Number(idEmpleado) : undefined
    );
    res.json({ pedidos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /pedidos/publico/:token — vista pública sin login (link de WhatsApp).
 * Al cliente solo le mostramos 3 estados posibles (pendiente/asignado/
 * terminado); si el pedido ya está Entregado o marcado No realizado, no
 * se expone ningún detalle (ni cliente, ni montos) — solo un aviso plano.
 */
export const getEstadoPublico = async (req, res) => {
  try {
    const idPedido = verificarTokenPedido(req.params.token);
    if (!idPedido) return res.status(404).json({ error: "Enlace inválido" });

    const pedido = await pedidoService.getPedidoById(idPedido);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

    const nombreEstado = (pedido.nombreEstado || "").toLowerCase();

    if (nombreEstado.includes("entrega")) {
      return res.json({ estadoPublico: "entregado" });
    }
    if (nombreEstado === "no realizado") {
      return res.json({ estadoPublico: "no-realizado" });
    }

    let estadoCliente = "pendiente";
    if (nombreEstado.includes("terminad")) estadoCliente = "terminado";
    else if (nombreEstado.includes("asignad")) estadoCliente = "asignado";

    const items = await itemPedidoService.getItemsPedido(idPedido);
    const totalItems = items.length;
    const itemsTerminados = items.filter(
      (it) => (it.nombreEstado || "").toLowerCase().includes("terminad")
    ).length;

    res.json({
      estadoPublico: "ok",
      pedido: {
        idPedido: pedido.idPedido,
        nombreCliente: pedido.nombreCliente,
        nombreTipoPedido: pedido.nombreTipoPedido,
        fechaRecibido: pedido.fechaRecibido,
        totalItems,
        itemsTerminados,
        fechaEntrega: pedido.fechaEntrega,
        valorTotal: pedido.valorTotal,
        totalAbonado: pedido.totalAbonado,
        estadoCliente,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPedidoById = async (req, res) => {
  try {
    const pedido = await pedidoService.getPedidoById(req.params.id);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json({ pedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPedido = async (req, res) => {
  try {
    const pedido = await pedidoService.createPedido(req.body);
    res.status(201).json({ pedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePedido = async (req, res) => {
  try {
    const { pedido, consolidacion } = await pedidoService.updatePedido(req.params.id, req.body);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json({ pedido, consolidacion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const revertirEstadoPedido = async (req, res) => {
  try {
    const pedido = await pedidoService.revertirEstadoPedido(req.params.id);
    res.json({ pedido });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePedido = async (req, res) => {
  try {
    await pedidoService.deletePedido(req.params.id);
    res.json({ message: "Pedido eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAbonosPedido = async (req, res) => {
  try {
    const abonos = await pedidoService.getAbonosPedido(req.params.id);
    res.json({ abonos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registrarAbonoPedido = async (req, res) => {
  try {
    const result = await pedidoService.registrarAbonoPedido(req.params.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getValorProgramado = async (req, res) => {
  try {
    const { fecha, excluirIdPedido } = req.query;
    const valorProgramado = await pedidoService.getValorProgramado(
      fecha,
      excluirIdPedido ? Number(excluirIdPedido) : undefined
    );
    res.json({ valorProgramado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
