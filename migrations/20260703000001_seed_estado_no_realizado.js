export const up = async (knex) => {
  const existe = await knex('estado').where({ nombre: 'No realizado' }).first();
  if (!existe) {
    await knex('estado').insert({
      nombre: 'No realizado',
      descripcion: 'Pedido que no se va a realizar — solo lo asigna un Admin, no cuenta para nómina',
    });
  }
};

export const down = async (knex) => {
  await knex('estado').where({ nombre: 'No realizado' }).del();
};
