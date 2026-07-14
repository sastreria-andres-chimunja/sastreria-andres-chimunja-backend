import db from "../config/database.js";

const TABLE = "limiteDiario";

// Es un valor único de configuración (una sola fila), no un catálogo por fecha.
export const getLimiteDiario = async () => db(TABLE).orderBy("idLimiteDiario", "asc").first();

export const updateLimiteDiario = async (monto) => {
  const actual = await getLimiteDiario();
  if (!actual) {
    const [nuevo] = await db(TABLE).insert({ monto }).returning("*");
    return nuevo;
  }
  const [updated] = await db(TABLE)
    .where({ idLimiteDiario: actual.idLimiteDiario })
    .update({ monto })
    .returning("*");
  return updated;
};
