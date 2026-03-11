/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("itemPedido", (table) => {
    table.increments("idItemPedido").primary();
    table
      .integer("idPedido")
      .references("idPedido")
      .inTable("pedido")
      .onDelete("CASCADE");

    table.integer("idEmpleado").references("idEmpleado").inTable("empleado");

    table.decimal("valor", 12, 2);
    table.decimal("comisionEmpleado", 12, 2);
    table.text("descripcion");
    table.integer("idEstado").references("idEstado").inTable("estado");

    table.text("observacion");
    table.date("fechaEntrega");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("itemPedido");
};
