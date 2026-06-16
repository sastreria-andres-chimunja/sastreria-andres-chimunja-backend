export const up = async (knex) => {
  const { count } = await knex('estado').count('* as count').first();
  if (Number(count) === 0) {
    await knex('estado').insert([
      { nombre: 'Pendiente',  descripcion: 'Pedido recibido, sin empleado asignado' },
      { nombre: 'Asignado',   descripcion: 'Tiene empleado asignado, en proceso' },
      { nombre: 'Terminado',  descripcion: 'Trabajo finalizado, pendiente de entrega' },
      { nombre: 'Entregado',  descripcion: 'Entregado al cliente' },
    ]);
  }
};

export const down = async (knex) => {
  await knex('estado')
    .whereIn('nombre', ['Pendiente', 'Asignado', 'Terminado', 'Entregado'])
    .del();
};
