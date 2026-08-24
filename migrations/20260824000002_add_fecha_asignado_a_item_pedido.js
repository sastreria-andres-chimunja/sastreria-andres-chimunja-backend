/**
 * "Mis ítems" del empleado necesita ordenar por fecha de ASIGNACIÓN (más
 * reciente primero), no por fecha de entrega -- no existía ningún campo
 * que registrara cuándo se le asignó el empleado a un ítem (fechaEntrega y
 * fechaTerminado ya existían, pero ninguno sirve para esto).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("itemPedido", (table) => {
    table.timestamp("fechaAsignado").nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("itemPedido", (table) => {
    table.dropColumn("fechaAsignado");
  });
}
