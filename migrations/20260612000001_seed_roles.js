export const up = async (knex) => {
  const { count } = await knex('rol').count('* as count').first();
  if (Number(count) === 0) {
    await knex('rol').insert([
      { nombre: 'Admin',     descripcion: 'Acceso completo al sistema' },
      { nombre: 'Asistente', descripcion: 'Gestiona pedidos, sin nómina' },
      { nombre: 'Operario',  descripcion: 'Solo sus propios trabajos' },
    ]);
  }
};

export const down = async (knex) => {
  await knex('rol').whereIn('nombre', ['Admin', 'Asistente', 'Operario']).del();
};
