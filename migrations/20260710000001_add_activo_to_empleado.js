export async function up(knex) {
  return knex.schema.alterTable("empleado", (table) => {
    table.boolean("activo").notNullable().defaultTo(true);
  });
}

export async function down(knex) {
  return knex.schema.alterTable("empleado", (table) => {
    table.dropColumn("activo");
  });
}
