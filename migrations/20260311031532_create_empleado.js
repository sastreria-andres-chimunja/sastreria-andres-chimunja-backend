/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("empleado", (table) => {
    table.increments("idEmpleado").primary();

    table.string("nombres", 100);
    table.string("apellidos", 100);
    table.string("telefono", 20);
    table.string("direccion", 200);
    table.date("fechaCumpleanios");
    table.integer("idRol").references("idRol").inTable("rol");

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("empleado");
};
