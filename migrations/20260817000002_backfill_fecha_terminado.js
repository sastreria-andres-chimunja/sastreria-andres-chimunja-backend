/**
 * Backfill puntual pedido por el cliente: para los ítems que ya estaban en
 * "Terminado" o "Entregado" ANTES de que existiera la columna
 * fechaTerminado (migración anterior), se usa la fecha de entrega como
 * mejor aproximación disponible de cuándo se completó el trabajo -- no es
 * la fecha exacta real (esa nunca se guardó), pero es preferible a dejar
 * la tarjeta "Facturado día a día" vacía para todo el trabajo previo.
 *
 * Solo toca ítems con fechaEntrega <= hoy (fechas futuras no tendrían
 * sentido como "ya se hizo") y que todavía no tengan fechaTerminado (no
 * pisa los que la nueva lógica de cambiarEstadoItem ya haya sellado con la
 * fecha real desde el deploy anterior).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const estados = await knex("estado")
    .whereRaw("LOWER(nombre) IN ('terminado', 'entregado')")
    .select("idEstado");
  const idsEstado = estados.map((e) => e.idEstado);
  if (idsEstado.length === 0) return;

  await knex("itemPedido")
    .whereIn("idEstado", idsEstado)
    .whereNull("fechaTerminado")
    .whereNotNull("fechaEntrega")
    .where("fechaEntrega", "<=", knex.raw("CURRENT_DATE"))
    .update({ fechaTerminado: knex.raw('"fechaEntrega"::timestamp') });
}

export async function down(knex) {
  const estados = await knex("estado")
    .whereRaw("LOWER(nombre) IN ('terminado', 'entregado')")
    .select("idEstado");
  const idsEstado = estados.map((e) => e.idEstado);
  if (idsEstado.length === 0) return;

  // Revierte solo las filas que coinciden con el patrón del backfill
  // (fechaTerminado a medianoche exacta = fechaEntrega) -- no toca las que
  // ya tenían una fecha real más precisa por otro camino.
  await knex("itemPedido")
    .whereIn("idEstado", idsEstado)
    .whereNotNull("fechaTerminado")
    .whereRaw('"fechaTerminado" = "fechaEntrega"::timestamp')
    .update({ fechaTerminado: null });
}
