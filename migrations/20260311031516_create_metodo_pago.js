/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("metodoPago", (table) => {
    table.increments("idMetodoPago").primary();
    table.string("nombreMetodoPago");
  });
}

export async function down(knex) {
  return knex.schema.dropTable("metodoPago");
}
