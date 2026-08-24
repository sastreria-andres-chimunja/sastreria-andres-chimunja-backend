/**
 * Nuevo método de pago "Crédito" -- lo usa la consolidación automática de
 * saldo al marcar un pedido como Entregado (el admin/asistente elige el
 * método en un diálogo de confirmación antes de que se cree el abono), y
 * el tab nuevo "Créditos" en Movimientos filtra por este método.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const existe = await knex("metodoPago")
    .whereRaw("LOWER(\"nombreMetodoPago\") = 'crédito'")
    .orWhereRaw("LOWER(\"nombreMetodoPago\") = 'credito'")
    .first();
  if (!existe) {
    await knex("metodoPago").insert({ nombreMetodoPago: "Crédito" });
  }
}

export async function down(knex) {
  await knex("metodoPago")
    .whereRaw("LOWER(\"nombreMetodoPago\") = 'crédito'")
    .orWhereRaw("LOWER(\"nombreMetodoPago\") = 'credito'")
    .del();
}
