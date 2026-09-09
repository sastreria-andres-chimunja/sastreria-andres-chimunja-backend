// Categoría de movimiento para el gasto que genera cada garantía (ver
// garantia.repository.js). No se usa el gate "count===0" de la seed
// original (20260613000012) porque esa tabla ya tiene filas en producción
// -- se inserta solo si "Garantías" todavía no existe.
export const up = async (knex) => {
  const existente = await knex("categoriaMovimiento")
    .where({ nombreCategoriaMovimiento: "Garantías" })
    .first();
  if (!existente) {
    await knex("categoriaMovimiento").insert({ nombreCategoriaMovimiento: "Garantías" });
  }
};

export const down = async (knex) => {
  await knex("categoriaMovimiento").where({ nombreCategoriaMovimiento: "Garantías" }).del();
};
