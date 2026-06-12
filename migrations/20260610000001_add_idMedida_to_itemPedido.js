/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  await knex.schema.table('itemPedido', (table) => {
    table
      .integer('idMedida')
      .unsigned()
      .nullable()
      .references('idMedida')
      .inTable('medidas')
      .onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  await knex.schema.table('itemPedido', (table) => {
    table.dropColumn('idMedida');
  });
};
