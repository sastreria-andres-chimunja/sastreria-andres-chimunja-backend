/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("movimiento", (table) => {
    table.increments("idMovimiento").primary();
    table.timestamp("fecha").defaultTo(knex.fn.now());

    table.decimal("valor", 12, 2);
    table
      .integer("idTipoMovimiento")
      .references("idTipoMovimiento")
      .inTable("tipoMovimiento");

    table
      .integer("idCategoriaMovimiento")
      .references("idCategoriaMovimiento")
      .inTable("categoriaMovimiento");

    table
      .integer("idMetodoPago")
      .references("idMetodoPago")
      .inTable("metodoPago");

    table.integer("idReferencia");
    table.string("tipoReferencia");
    table.text("observacion");
    table.index(["tipoReferencia", "idReferencia"]);
  });
}

export async function down(knex) {
  return knex.schema.dropTable("movimiento");
}
