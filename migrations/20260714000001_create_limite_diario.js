/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("limiteDiario", (table) => {
    table.increments("idLimiteDiario").primary();
    table.decimal("monto", 12, 2).notNullable();
  });
}

export async function down(knex) {
  return knex.schema.dropTable("limiteDiario");
}
