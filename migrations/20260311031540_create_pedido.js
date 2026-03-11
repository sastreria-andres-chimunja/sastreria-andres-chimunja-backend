/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("pedido", (table) => {
    table.increments("idPedido").primary();
    table.integer("idCliente").references("idCliente").inTable("cliente");

    table.date("fechaRecibido");
    table.date("fechaEntrega");
    table.decimal("valorTotal", 12, 2);
    table.integer("idEstado").references("idEstado").inTable("estado");

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("pedido");
};
