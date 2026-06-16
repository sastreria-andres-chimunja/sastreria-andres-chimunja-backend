export const up = async (knex) => {
  const { count } = await knex('tipoMovimiento').count('* as count').first();
  if (Number(count) === 0) {
    await knex('tipoMovimiento').insert([
      { nombreTipoMovimiento: 'Ingreso' },
      { nombreTipoMovimiento: 'Salida' },
    ]);
  }
};

export const down = async (knex) => {
  await knex('tipoMovimiento')
    .whereIn('nombreTipoMovimiento', ['Ingreso', 'Salida'])
    .del();
};
