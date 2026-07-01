export const up = async (knex) => {
  await knex.schema.table("movimiento", (t) => {
    t.boolean("liquidado").notNullable().defaultTo(false);
  });
};

export const down = async (knex) => {
  await knex.schema.table("movimiento", (t) => {
    t.dropColumn("liquidado");
  });
};
