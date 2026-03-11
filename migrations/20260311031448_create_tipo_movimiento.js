/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("tipoMovimiento", (table) => {
    table.increments("idTipoMovimiento").primary();
    table.string("nombreTipoMovimiento");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("tipoMovimiento");
};
