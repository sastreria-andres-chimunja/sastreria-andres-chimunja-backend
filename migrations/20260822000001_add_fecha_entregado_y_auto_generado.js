/**
 * - pedido.fechaEntregado: momento en que el pedido pasó a "Entregado"
 *   (nullable -- se sella la primera vez, se limpia si se revierte).
 * - movimiento.autoGenerado: marca los movimientos que el sistema crea
 *   solo, sin que nadie los registre a mano (por ahora: el consolidado
 *   automático del saldo al entregar un pedido) -- para poder
 *   identificarlos y revertirlos si el estado se revierte.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("pedido", (table) => {
    table.timestamp("fechaEntregado").nullable();
  });
  await knex.schema.alterTable("movimiento", (table) => {
    table.boolean("autoGenerado").notNullable().defaultTo(false);
  });
}

export async function down(knex) {
  await knex.schema.alterTable("pedido", (table) => {
    table.dropColumn("fechaEntregado");
  });
  await knex.schema.alterTable("movimiento", (table) => {
    table.dropColumn("autoGenerado");
  });
}
