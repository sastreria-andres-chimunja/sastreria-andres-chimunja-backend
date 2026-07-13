import * as tipoPedidoService from "../services/tipoPedido.service.js";

export const getTiposPedido = async (req, res) => {
  try {
    const tiposPedido = await tipoPedidoService.getTiposPedido();
    res.json({ tiposPedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTipoPedidoById = async (req, res) => {
  try {
    const tipoPedido = await tipoPedidoService.getTipoPedidoById(req.params.id);
    if (!tipoPedido) return res.status(404).json({ error: "Tipo de pedido no encontrado" });
    res.json({ tipoPedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
