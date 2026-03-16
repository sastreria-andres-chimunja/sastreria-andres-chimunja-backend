/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("cliente", (table) => {
    table.increments("idCliente").primary();
    table.string("nombres", 100);
    table.string("apellidos", 100);
    table.string("telefono", 20);
    table.string("cedula", 20).unique();
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable("cliente");
}
