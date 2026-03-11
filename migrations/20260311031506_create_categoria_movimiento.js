/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("categoriaMovimiento", (table) => {
    table.increments("idCategoriaMovimiento").primary();
    table.string("nombreCategoriaMovimiento");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("categoriaMovimiento");
};
