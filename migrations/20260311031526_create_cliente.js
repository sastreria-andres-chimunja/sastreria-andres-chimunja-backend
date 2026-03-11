/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("cliente", (table) => {
    table.increments("idCliente").primary();
    table.string("nombres", 100);
    table.string("apellidos", 100);
    table.string("telefono", 20);
    table.string("cedula", 20);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("cliente");
};
