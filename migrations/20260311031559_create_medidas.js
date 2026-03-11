/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("medidas", (table) => {
    table.increments("idMedida").primary();
    table.timestamp("fecha").defaultTo(knex.fn.now());
    table.integer("idCliente").references("idCliente").inTable("cliente");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("medidas");
};
