export const up = async (knex) => {
  const existing = await knex('estado').count('* as count').first();
  if (Number(existing.count) === 0) {
    await knex('estado').insert([
      { nombre: 'Pendiente',  descripcion: 'Pedido recibido, sin asignar' },
      { nombre: 'Asignado',   descripcion: 'Asignado a un empleado' },
      { nombre: 'Terminado',  descripcion: 'Prenda terminada, pendiente de entrega' },
      { nombre: 'Entregado',  descripcion: 'Entregado al cliente' },
    ]);
  }
};

export const down = async (knex) => {
  await knex('estado').whereIn('nombre', ['Pendiente', 'Asignado', 'Terminado', 'Entregado']).del();
};
