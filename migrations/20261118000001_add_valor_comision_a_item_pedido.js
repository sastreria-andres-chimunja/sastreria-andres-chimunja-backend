/**
 * Comisión de valor fijo para ítems de CONFECCIÓN: el admin escribe el
 * valor exacto que se le paga al empleado por ese ítem y la nómina usa ese
 * valor en vez de valor × comisionEmpleado %. Nulo = se calcula por % como
 * siempre (todos los arreglos, y las confecciones sin valor fijo).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable("itemPedido", (table) => {
    table.decimal("valorComision", 12, 2).nullable();
  });
}

export async function down(knex) {
  return knex.schema.alterTable("itemPedido", (table) => {
    table.dropColumn("valorComision");
  });
}
