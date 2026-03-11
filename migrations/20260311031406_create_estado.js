/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("estado", (table) => {
    table.increments("idEstado").primary();
    table.string("nombre");
    table.string("descripcion");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("estado");
};
