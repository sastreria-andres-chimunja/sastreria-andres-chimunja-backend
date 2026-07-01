import knex from "knex";
import knexConfig from "../../knexfile.js";

const env = process.env.NODE_ENV === "production" ? "production" : "development";
const db = knex(knexConfig[env]);

export default db;
