/**
 * "Garantías": un empleado registra que tuvo que rehacer un trabajo sin
 * costo para el cliente (nombre del cliente + valor de lo gastado en
 * repetirlo). Ese mismo valor se registra UNA sola vez como gasto real del
 * negocio (movimiento asociado, ver garantia.repository.js) y además se
 * reconoce en la nómina del empleado que la reportó -- "pagado" indica si
 * ya se marcó como liquidada en su nómina (sin generar un segundo
 * movimiento de dinero: el gasto real ya quedó registrado al crearla).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("garantia", (table) => {
    table.increments("idGarantia").primary();
    table
      .integer("idEmpleado")
      .unsigned()
      .references("idEmpleado")
      .inTable("empleado");
    table.string("nombreCliente", 150).notNullable();
    table.decimal("valor", 12, 2).notNullable();
    table.boolean("pagado").notNullable().defaultTo(false);
    table.timestamp("fecha").defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable("garantia");
}
