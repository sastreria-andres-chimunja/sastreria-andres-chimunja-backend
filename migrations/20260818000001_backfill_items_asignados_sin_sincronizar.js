/**
 * Corrige un bug real encontrado: el diálogo de "Editar ítem" (asignación
 * individual de empleado, distinta del botón masivo "Asignar empleado" de
 * toda la hoja de trabajo) no recalculaba el Estado del ítem al elegir un
 * empleado -- el ítem se guardaba con idEmpleado puesto pero Estado seguía
 * en "Pendiente", así que nunca aparecía en "Mis ítems" (esa vista oculta
 * los Pendiente) ni contaba como trabajo asignado. El botón masivo sí
 * recalculaba bien (por eso el cliente veía la diferencia entre asignar
 * "en conjunto" vs. individual). El bug de código ya se corrigió aparte
 * (item-pedido-dialog ahora sincroniza el Estado en el propio formulario);
 * este backfill solo arregla los datos que ya quedaron mal antes de eso.
 *
 * Deja cada ítem roto (idEmpleado puesto, Estado=Pendiente) en "Asignado"
 * -- el estado correcto según la propia regla del sistema (getIdEstadoAuto)
 * -- y recalcula el Estado del pedido de cada uno con el mismo criterio de
 * sincronizarEstadoPedido() en itemPedido.repository.js.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const estados = await knex("estado").select("idEstado", "nombre");
  const byName = Object.fromEntries(estados.map((e) => [e.nombre.toLowerCase(), e.idEstado]));
  const idPendiente = byName["pendiente"];
  const idAsignado = byName["asignado"];
  const idTerminado = byName["terminado"];
  const idEntregado = byName["entregado"];
  const idNoRealizado = byName["no realizado"];
  if (idPendiente == null || idAsignado == null) return;

  let rotosQuery = knex("itemPedido as ip")
    .join("pedido as p", "p.idPedido", "ip.idPedido")
    .whereNotNull("ip.idEmpleado")
    .where("ip.idEstado", idPendiente);
  if (idNoRealizado != null) rotosQuery = rotosQuery.whereNot("p.idEstado", idNoRealizado);
  const rotos = await rotosQuery.select("ip.idItemPedido", "ip.idPedido");
  if (rotos.length === 0) return;

  await knex("itemPedido").whereIn("idItemPedido", rotos.map((r) => r.idItemPedido)).update({ idEstado: idAsignado });

  const idsPedido = [...new Set(rotos.map((r) => r.idPedido))];
  for (const idPedido of idsPedido) {
    const pedido = await knex("pedido").where({ idPedido }).select("idEstado").first();
    if (!pedido) continue;
    if (idNoRealizado != null && pedido.idEstado === idNoRealizado) continue;

    const items = await knex("itemPedido").where({ idPedido }).select("idEstado");
    if (items.length === 0) continue;

    const todosEntregado = idEntregado != null && items.every((i) => i.idEstado === idEntregado);
    const todosTerminado = idTerminado != null && items.every((i) => i.idEstado === idTerminado);
    const algunoEnProceso = items.some((i) => [idAsignado, idTerminado, idEntregado].includes(i.idEstado));

    let nuevoIdEstado = null;
    if (todosEntregado) nuevoIdEstado = idEntregado;
    else if (todosTerminado) nuevoIdEstado = idTerminado;
    else if (algunoEnProceso) nuevoIdEstado = idAsignado;
    else if (idPendiente != null) nuevoIdEstado = idPendiente;

    if (nuevoIdEstado != null && nuevoIdEstado !== pedido.idEstado) {
      await knex("pedido").where({ idPedido }).update({ idEstado: nuevoIdEstado });
    }
  }
}

export async function down(knex) {
  // No se puede revertir con precisión (no se guardó cuál era el Estado
  // exacto de cada ítem/pedido antes del backfill) -- no-op intencional.
}
