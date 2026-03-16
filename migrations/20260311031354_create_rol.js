/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("rol", (table) => {
    table.increments("idRol").primary();

    table.string("nombre", 50);
    table.text("descripcion");
  });
}

export async function down(knex) {
  return knex.schema.dropTable("rol");
}
