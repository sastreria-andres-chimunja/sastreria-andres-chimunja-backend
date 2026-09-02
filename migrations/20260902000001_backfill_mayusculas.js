/**
 * A pedido del cliente, todo el texto libre de la app se guarda en
 * mayúsculas de ahora en adelante (ver src/utils/text.utils.js, usado en
 * los repositorios de cliente/empleado/itemPedido/movimiento/medida al
 * crear/editar). Esta migración es el backfill de una sola vez para que
 * TODO lo ya guardado también aparezca en mayúsculas, no solo lo nuevo.
 *
 * Irreversible a propósito -- down() no restaura el case original (se
 * perdió al hacer UPPER()), es normalización de datos, no un cambio de
 * esquema. Mismo criterio que otras migraciones de backfill de este
 * proyecto (ver 20260818000001_backfill_items_asignados_sin_sincronizar.js).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`UPDATE cliente SET nombres = UPPER(nombres), apellidos = UPPER(apellidos)`);
  await knex.raw(`UPDATE empleado SET nombres = UPPER(nombres), apellidos = UPPER(apellidos), direccion = UPPER(direccion)`);
  await knex.raw(`UPDATE "itemPedido" SET descripcion = UPPER(descripcion), observacion = UPPER(observacion)`);
  await knex.raw(`UPDATE movimiento SET observacion = UPPER(observacion)`);
  await knex.raw(`UPDATE medidas SET "tipoPrenda" = UPPER("tipoPrenda"), observaciones = UPPER(observaciones), otros = UPPER(otros)`);
}

export async function down(knex) {
  // No reversible -- ver nota arriba.
}
