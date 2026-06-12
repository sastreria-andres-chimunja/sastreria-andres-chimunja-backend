export const up = async (knex) => {
  await knex.schema.table('itemPedido', (table) => {
    table.boolean('pagado').notNullable().defaultTo(false);
  });
};

export const down = async (knex) => {
  await knex.schema.table('itemPedido', (table) => {
    table.dropColumn('pagado');
  });
};
