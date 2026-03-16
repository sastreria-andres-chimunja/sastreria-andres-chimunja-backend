/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("tipoMovimiento", (table) => {
    table.increments("idTipoMovimiento").primary();
    table.string("nombreTipoMovimiento");
  });
}

export async function down(knex) {
  return knex.schema.dropTable("tipoMovimiento");
}
