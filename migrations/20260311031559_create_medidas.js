/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("medidas", (table) => {
    table.increments("idMedida").primary();

    table
      .integer("idCliente")
      .unsigned()
      .references("idCliente")
      .inTable("cliente");

    table.decimal("espalda", 5, 2);
    table.decimal("hombro", 5, 2);
    table.decimal("talleDelantero", 5, 2);
    table.decimal("talleTrasero", 5, 2);
    table.decimal("distancia", 5, 2);
    table.decimal("separacion", 5, 2);
    table.decimal("pecho", 5, 2);
    table.decimal("cintura", 5, 2);
    table.decimal("base", 5, 2);
    table.decimal("largo", 5, 2);
    table.decimal("largoManga", 5, 2);
    table.decimal("anchoManga", 5, 2);
    table.decimal("escote", 5, 2);
    table.decimal("tiro", 5, 2);
    table.decimal("pierna", 5, 2);
    table.decimal("rodilla", 5, 2);
    table.decimal("bota", 5, 2);
    table.text("otros");
    table.text("tipoPrenda");
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable("medidas");
}
