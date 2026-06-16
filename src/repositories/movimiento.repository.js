import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

const TABLE = "movimiento";

const formatMovimiento = (m) =>
  m ? { ...m, fecha: formatFecha(m.fecha) } : null;

const RICH_QUERY = () =>
  db(TABLE)
    .leftJoin("tipoMovimiento as tm", "tm.idTipoMovimiento", `${TABLE}.idTipoMovimiento`)
    .leftJoin("categoriaMovimiento as cm", "cm.idCategoriaMovimiento", `${TABLE}.idCategoriaMovimiento`)
    .leftJoin("metodoPago as mp", "mp.idMetodoPago", `${TABLE}.idMetodoPago`)
    .select(
      `${TABLE}.*`,
      "tm.nombreTipoMovimiento",
      "cm.nombreCategoriaMovimiento",
      "mp.nombreMetodoPago"
    );

export const getMovimientoById = async (idMovimiento) => {
  const m = await RICH_QUERY().where({ [`${TABLE}.idMovimiento`]: idMovimiento }).first();
  return formatMovimiento(m);
};

export const getMovimientosByEmpleado = async (idReferencia) => {
  const m = await RICH_QUERY()
    .whereIn(`${TABLE}.tipoReferencia`, ["Nómina", "empleado"])
    .where(`${TABLE}.idReferencia`, idReferencia)
    .first();
  return formatMovimiento(m);
};

export const getMovimientos = async (fechaInicio, fechaFin, categoria) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let query = RICH_QUERY().orderBy(`${TABLE}.fecha`, "desc");
  if (desde) query = query.where(`${TABLE}.fecha`, ">=", desde);
  if (hasta) query = query.where(`${TABLE}.fecha`, "<=", hasta);

  // Filtro por categoría lógica para los 3 tabs del frontend
  if (categoria === "pedidos") {
    query = query.whereIn(`${TABLE}.tipoReferencia`, ["itemPedido", "pedido", "Pedidos", "Ventas"]);
  } else if (categoria === "nomina") {
    query = query.whereIn(`${TABLE}.tipoReferencia`, ["empleado", "Nómina", "nomina_item"]);
  } else if (categoria === "gastos") {
    query = query.where(function () {
      this.whereNull(`${TABLE}.tipoReferencia`).orWhereNotIn(`${TABLE}.tipoReferencia`, [
        "itemPedido", "pedido", "Pedidos", "Ventas", "empleado", "Nómina", "nomina_item",
      ]);
    });
  }

  const movimientos = await query;
  return movimientos.map(formatMovimiento);
};

const soloColumnasTabla = (movimiento, fechaDefault = null) => ({
  valor:                 movimiento.valor,
  fecha:                 movimiento.fecha ? parseFecha(movimiento.fecha) : (fechaDefault ?? db.fn.now()),
  idTipoMovimiento:      movimiento.idTipoMovimiento,
  idCategoriaMovimiento: movimiento.idCategoriaMovimiento,
  idMetodoPago:          movimiento.idMetodoPago ?? null,
  tipoReferencia:        movimiento.tipoReferencia ?? null,
  idReferencia:          movimiento.idReferencia ?? null,
  observacion:           movimiento.observacion ?? null,
});

export const createMovimiento = async (movimiento) => {
  const data = soloColumnasTabla(movimiento);
  const [newMovimiento] = await db(TABLE).insert(data).returning("*");
  return getMovimientoById(newMovimiento.idMovimiento);
};

export const updateMovimiento = async (idMovimiento, movimiento) => {
  const data = soloColumnasTabla(movimiento);
  await db(TABLE).where({ idMovimiento }).update(data);
  return getMovimientoById(idMovimiento);
};

export const deleteMovimiento = async (idMovimiento) =>
  db(TABLE).where({ idMovimiento }).del();
