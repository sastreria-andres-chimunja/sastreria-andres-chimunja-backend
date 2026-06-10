/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("auth", (table) => {
    table.increments("idAuth").primary();
    table
      .integer("idEmpleado")
      .notNullable()
      .unique()
      .references("idEmpleado")
      .inTable("empleado")
      .onDelete("CASCADE");
    table.string("clave", 255).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable("auth");
}
