/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("categoriaMovimiento", (table) => {
    table.increments("idCategoriaMovimiento").primary();
    table.string("nombreCategoriaMovimiento");
  });
}

export async function down(knex) {
  return knex.schema.dropTable("categoriaMovimiento");
}
