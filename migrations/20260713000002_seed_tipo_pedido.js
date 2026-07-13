export const up = async (knex) => {
  const { count } = await knex('tipoPedido').count('* as count').first();
  if (Number(count) === 0) {
    await knex('tipoPedido').insert([
      { nombre: 'Arreglo' },
      { nombre: 'Confección' },
    ]);
  }
};

export const down = async (knex) => {
  await knex('tipoPedido')
    .whereIn('nombre', ['Arreglo', 'Confección'])
    .del();
};
