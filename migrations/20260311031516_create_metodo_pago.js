/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("metodoPago", (table) => {
    table.increments("idMetodoPago").primary();
    table.string("nombreMetodoPago");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("metodoPago");
};
