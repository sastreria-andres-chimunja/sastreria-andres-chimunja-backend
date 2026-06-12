import * as itemPedidoService from "../services/itemPedido.service.js";

export const getItemsPedido = async (req, res) => {
  try {
    const { idPedido, fechaInicio, fechaFin } = req.query;
    const items = await itemPedidoService.getItemsPedido(
      idPedido ? Number(idPedido) : undefined,
      fechaInicio,
      fechaFin
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
