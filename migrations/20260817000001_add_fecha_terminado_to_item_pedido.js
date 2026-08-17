/**
 * Registra el momento exacto en que un ítem pasa a estado "Terminado" —
 * necesario para poder mostrarle al empleado "lo que llevo facturado"
 * agrupado por el día real en que completó el trabajo, en vez de la fecha
 * de entrega (que el admin fija de antemano y no refleja cuándo se hizo
 * el trabajo). Nullable: los ítems que ya estaban en Terminado antes de
 * este cambio no tienen forma honesta de saber cuándo pasó eso, así que
 * quedan sin fecha (no se fabrica un valor) — el campo se empieza a
 * llenar desde ahora en adelante, cada vez que un ítem se marca Terminado.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.alterTable("itemPedido", (table) => {
    table.timestamp("fechaTerminado").nullable();
  });
}

export async function down(knex) {
  return knex.schema.alterTable("itemPedido", (table) => {
    table.dropColumn("fechaTerminado");
  });
}
