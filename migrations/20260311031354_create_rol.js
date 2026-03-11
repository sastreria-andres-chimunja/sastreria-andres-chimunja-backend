/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("rol", (table) => {
    table.increments("idRol").primary();

    table.string("nombre", 50);
    table.text("descripcion");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("rol");
};
