import * as pedidoService from "../services/pedido.service.js";

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
    const pedido = await pedidoService.updatePedido(req.params.id, req.body);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json({ pedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
