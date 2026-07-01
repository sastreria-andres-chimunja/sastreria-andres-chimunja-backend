import * as itemPedidoService from "../services/itemPedido.service.js";

export const getItemsPedido = async (req, res) => {
  try {
    const { idPedido, fechaInicio, fechaFin, idEmpleado } = req.query;
    const items = await itemPedidoService.getItemsPedido(
      idPedido ? Number(idPedido) : undefined,
      fechaInicio,
      fechaFin,
      idEmpleado ? Number(idEmpleado) : undefined
    );
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getItemPedidoById = async (req, res) => {
  try {
    const item = await itemPedidoService.getItemPedidoById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item no encontrado" });
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createItemPedido = async (req, res) => {
  try {
    const item = await itemPedidoService.createItemPedido(req.body);
    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateItemPedido = async (req, res) => {
  try {
    const item = await itemPedidoService.updateItemPedido(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "Item no encontrado" });
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteItemPedido = async (req, res) => {
  try {
    await itemPedidoService.deleteItemPedido(req.params.id);
    res.json({ message: "Item eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const pagarItemPedido = async (req, res) => {
  try {
    const item = await itemPedidoService.pagarItemPedido(req.params.id);
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPagosItem = async (req, res) => {
  try {
    const pagos = await itemPedidoService.getPagosItem(req.params.id);
    res.json({ pagos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registrarPago = async (req, res) => {
  try {
    const result = await itemPedidoService.registrarPago(req.params.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cambiarEstadoItem = async (req, res) => {
  try {
    const { idEstado } = req.body;
    const item = await itemPedidoService.cambiarEstadoItem(req.params.id, idEstado);
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cambiarComisionItem = async (req, res) => {
  try {
    const { comisionEmpleado } = req.body;
    const item = await itemPedidoService.cambiarComisionItem(req.params.id, comisionEmpleado);
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
