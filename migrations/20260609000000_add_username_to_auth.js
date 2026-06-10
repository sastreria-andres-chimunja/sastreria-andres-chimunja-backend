/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.table("auth", (table) => {
    table.string("username", 100).nullable().unique();
  });
}

export async function down(knex) {
  await knex.schema.table("auth", (table) => {
    table.dropColumn("username");
  });
}
