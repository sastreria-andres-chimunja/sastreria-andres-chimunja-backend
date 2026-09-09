/**
 * "Garantías" ahora reconocen al empleado un % de comisión sobre el valor
 * (igual que itemPedido.comisionEmpleado), en vez del 100% fijo -- el
 * gasto real del negocio (movimiento creado en garantia.repository.js)
 * sigue siendo el valor COMPLETO, sin verse afectado por este %; solo
 * cambia cuánto de eso se le reconoce al empleado en su nómina.
 *
 * Default 100 -- las garantías ya existentes (creadas antes de este
 * cambio, cuando siempre era el 100%) siguen viéndose exactamente igual
 * que antes; el admin puede bajarlo desde el detalle de nómina.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable("garantia", (table) => {
    table.decimal("comisionEmpleado", 5, 2).notNullable().defaultTo(100);
  });
}

export async function down(knex) {
  return knex.schema.alterTable("garantia", (table) => {
    table.dropColumn("comisionEmpleado");
  });
}
