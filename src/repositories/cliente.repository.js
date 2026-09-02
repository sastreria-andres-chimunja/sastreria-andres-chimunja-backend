import db from "../config/database.js";
import { mayus } from "../utils/text.utils.js";

const TABLE = "cliente";

export const getAllClientes = async () => {
  return db(TABLE).select("*");
};

export const getClienteById = async (id) => {
  return db(TABLE).where({ idCliente: id }).first();
};
export const getClienteByIdentification = async (identification) => {
  return db(TABLE).where({ cedula: identification }).first();
};

export const searchClientes = async (text) => {
  return db(TABLE)
    .where("nombres", "ilike", `%${text}%`)
    .orWhere("apellidos", "ilike", `%${text}%`)
    .orWhere("telefono", "ilike", `%${text}%`)
    .orWhere("cedula", "ilike", `%${text}%`);
};

// No debe existir ya un cliente con el mismo nombres+apellidos+teléfono
// (comparación insensible a mayúsculas/espacios extremos) -- evita cargar
// el mismo cliente duplicado dos veces por error. `excluirId` se usa al
// editar, para no chocar contra el propio registro que se está guardando.
const existeClienteDuplicado = async (nombres, apellidos, telefono, excluirId) => {
  let query = db(TABLE)
    .whereRaw('LOWER(TRIM(nombres)) = LOWER(TRIM(?))', [nombres ?? ""])
    .whereRaw('LOWER(TRIM(apellidos)) = LOWER(TRIM(?))', [apellidos ?? ""])
    .whereRaw('TRIM(telefono) = TRIM(?)', [telefono ?? ""]);
  if (excluirId) query = query.whereNot({ idCliente: excluirId });
  return query.first();
};

export const createCliente = async (cliente) => {
  const duplicado = await existeClienteDuplicado(cliente.nombres, cliente.apellidos, cliente.telefono);
  if (duplicado) {
    throw new Error(`Ya existe un cliente con ese nombre y teléfono: ${duplicado.nombres} ${duplicado.apellidos}`);
  }

  const data = { ...cliente, nombres: mayus(cliente.nombres), apellidos: mayus(cliente.apellidos) };
  const [newCliente] = await db(TABLE).insert(data).returning("*");

  return newCliente;
};

export const updateCliente = async (id, cliente) => {
  const duplicado = await existeClienteDuplicado(cliente.nombres, cliente.apellidos, cliente.telefono, id);
  if (duplicado) {
    throw new Error(`Ya existe otro cliente con ese nombre y teléfono: ${duplicado.nombres} ${duplicado.apellidos}`);
  }

  const data = { ...cliente, nombres: mayus(cliente.nombres), apellidos: mayus(cliente.apellidos) };
  const [updated] = await db(TABLE)
    .where({ idCliente: id })
    .update(data)
    .returning("*");

  return updated;
};

export const deleteCliente = async (id) => {
  return db(TABLE).where({ idCliente: id }).del();
};
