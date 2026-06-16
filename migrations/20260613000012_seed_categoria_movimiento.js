export const up = async (knex) => {
  const { count } = await knex('categoriaMovimiento').count('* as count').first();
  if (Number(count) === 0) {
    await knex('categoriaMovimiento').insert([
      { nombreCategoriaMovimiento: 'Nómina' },
      { nombreCategoriaMovimiento: 'Pedidos' },
      { nombreCategoriaMovimiento: 'Insumos' },
    ]);
  }
};

export const down = async (knex) => {
  await knex('categoriaMovimiento')
    .whereIn('nombreCategoriaMovimiento', ['Nómina', 'Pedidos', 'Ventas', 'Insumos', 'Insumos o Gastos'])
    .del();
};
