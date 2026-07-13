export async function up(knex) {
  await knex.schema.alterTable("pedido", (table) => {
    table.integer("idTipoPedido").references("idTipoPedido").inTable("tipoPedido");
  });

  // Pedidos históricos (previos a este cambio) se clasifican como "Arreglo" por defecto.
  const arreglo = await knex("tipoPedido").where({ nombre: "Arreglo" }).first();
  if (arreglo) {
    await knex("pedido").whereNull("idTipoPedido").update({ idTipoPedido: arreglo.idTipoPedido });
  }
}

export async function down(knex) {
  return knex.schema.alterTable("pedido", (table) => {
    table.dropColumn("idTipoPedido");
  });
}
