/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("estado", (table) => {
    table.increments("idEstado").primary();
    table.string("nombre");
    table.string("descripcion");
  });
}

export async function down(knex) {
  return knex.schema.dropTable("estado");
}
