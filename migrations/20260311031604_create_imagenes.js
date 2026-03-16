/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("imagenes", (table) => {
    table.increments("idImagen").primary();
    table.string("tipoReferencia", 50);
    table.integer("idReferencia");
    table.string("rutaImagen", 200);
    table.string("nombreArchivo", 200);
    table.string("mimeType", 100);
    table.timestamp("fecha").defaultTo(knex.fn.now());

    table.text("descripcion");
  });
}

export async function down(knex) {
  return knex.schema.dropTable("imagenes");
}
