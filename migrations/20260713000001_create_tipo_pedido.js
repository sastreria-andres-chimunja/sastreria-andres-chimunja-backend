/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("tipoPedido", (table) => {
    table.increments("idTipoPedido").primary();
    table.string("nombre").notNullable();
  });
}

export async function down(knex) {
  return knex.schema.dropTable("tipoPedido");
}
