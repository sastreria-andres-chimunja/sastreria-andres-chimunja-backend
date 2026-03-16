import * as clienteService from "../services/cliente.service.js";

export const getClientes = async (req, res) => {
  try {
    const clientes = await clienteService.getClientes();
    res.json({ clientes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getClienteById = async (req, res) => {
  try {
    const cliente = await clienteService.getClienteById(req.params.id);
    res.json({ cliente });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const searchClientes = async (req, res) => {
  try {
    const { q } = req.query;

    const clientes = await clienteService.searchClientes(q);

    res.json({ clientes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createCliente = async (req, res) => {
  try {
    const cliente = await clienteService.createCliente(req.body);
    res.json({ cliente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const cliente = await clienteService.updateCliente(req.params.id, req.body);

    res.json({ cliente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    await clienteService.deleteCliente(req.params.id);

    res.json({
      message: "Cliente eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
