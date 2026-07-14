// Valor inicial muy alto (equivalente a "sin límite") para no bloquear pedidos
// existentes hasta que el admin configure el monto real desde el menú.
export const up = async (knex) => {
  const { count } = await knex('limiteDiario').count('* as count').first();
  if (Number(count) === 0) {
    await knex('limiteDiario').insert([{ monto: 999999999 }]);
  }
};

export const down = async (knex) => {
  await knex('limiteDiario').del();
};
