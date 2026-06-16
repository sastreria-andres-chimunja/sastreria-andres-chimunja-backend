export async function up(knex) {
  return knex.schema.alterTable("auth", (table) => {
    table.boolean("debeCambiarClave").notNullable().defaultTo(true);
  });
}

export async function down(knex) {
  return knex.schema.alterTable("auth", (table) => {
    table.dropColumn("debeCambiarClave");
  });
}
