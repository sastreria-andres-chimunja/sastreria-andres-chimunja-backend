import knex from "knex";
import knexConfig from "../../knexfile.js";

// Hora de Colombia para todo el proceso (new Date(), setHours, etc.): el VPS
// corre en UTC y "hoy" se cortaba a las 7 pm hora local (ej. cupo diario).
process.env.TZ = "America/Bogota";

const env = process.env.NODE_ENV === "production" ? "production" : "development";
const db = knex(knexConfig[env]);

export default db;
