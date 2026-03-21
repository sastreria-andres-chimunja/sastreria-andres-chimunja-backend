import * as clienteRepository from "../repositories/cliente.repository.js";

export const getClientes = async () => {
  return clienteRepository.getAllClientes();
};

export const getClienteById = async (id) => {
  const cliente = await clienteRepository.getClienteById(id);

  if (!cliente) {
    throw new Error("Cliente no encontrado");
  }

  return cliente;
};

export const searchClientes = async (text) => {
  if (!text || text.trim() === "") {
    throw new Error("Debe ingresar un texto de búsqueda");
  }

  return clienteRepository.searchClientes(text);
};

export const createCliente = async (data) => {
  const cliente = await clienteRepository.getClienteByIdentification(
    data.cedula,
  );
  if (cliente) {
    throw new Error("El cliente ya existe");
  }
  const { nombres, apellidos, cedula, telefono } = data;
  return clienteRepository.createCliente({
    nombres,
    apellidos,
    cedula,
    telefono,
  });
};

export const updateCliente = async (id, data) => {
  return clienteRepository.updateCliente(id, data);
};

export const deleteCliente = async (id) => {
  return clienteRepository.deleteCliente(id);
};
