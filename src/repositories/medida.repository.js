import db from "../config/database.js";
import { formatFecha } from "../utils/date.utils.js";

const TABLE = "medidas";

const formatMedida = (m) =>
  m ? { ...m, created_at: formatFecha(m.created_at) } : null;

export const getMedidaById = async (idMedida) => {
  const m = await db(TABLE).where({ idMedida }).first();
  return formatMedida(m);
};

export const getMedidasByClientId = async (idCliente) => {
  const medidas = await db(TABLE).where({ idCliente });
  return medidas.map(formatMedida);
};

export const createMedida = async (medida) => {
  const [newMedida] = await db(TABLE).insert(medida).returning("*");
  return formatMedida(newMedida);
};

export const updateMedida = async (idMedida, medida) => {
  const [updated] = await db(TABLE)
    .where({ idMedida })
    .update(medida)
    .returning("*");
  return formatMedida(updated);
};

export const deleteMedida = async (idMedida) => {
  return db(TABLE).where({ idMedida }).del();
};
