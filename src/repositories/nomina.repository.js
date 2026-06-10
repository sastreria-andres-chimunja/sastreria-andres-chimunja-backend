import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

// ─────────────────────────────────────────────
//  Nómina individual
// ─────────────────────────────────────────────
export const getNominaEmpleado = async (idEmpleado, fechaInicio, fechaFin) => {
  const empleado = await db("empleado").where({ idEmpleado }).first();
  if (!empleado) return null;

  // Convertir filtros de dd/mm/yyyy → yyyy-mm-dd para PostgreSQL
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  // Entradas: ítems asignados al empleado (con filtro opcional por fechaEntrega)
  let itemsQuery = db("itemPedido as ip")
    .leftJoin("pedido as p", "p.idPedido", "ip.idPedido")
    .where("ip.idEmpleado", idEmpleado)
    .select(
      "ip.idItemPedido",
      "ip.descripcion",
      "ip.valor",
      "ip.comisionEmpleado",
      "ip.fechaEntrega",
      "ip.idEstado",
      "p.idPedido",
      "p.fechaRecibido",
      "p.idCliente"
    );
  if (desde) itemsQuery = itemsQuery.where("ip.fechaEntrega", ">=", desde);
  if (hasta) itemsQuery = itemsQuery.where("ip.fechaEntrega", "<=", hasta);
  const items = await itemsQuery;

  const itemsFormateados = items.map((item) => ({
    ...item,
    fechaEntrega: formatFecha(item.fechaEntrega),
    fechaRecibido: formatFecha(item.fechaRecibido),
  }));

  const totalEntradas = itemsFormateados.reduce(
    (sum, item) => sum + Number(item.valor ?? 0),
    0
  );

  // Salidas: abonos (tipoReferencia = 'Nómina') con filtro opcional por fecha
  let abonosQuery = db("movimiento as m")
    .join("tipoMovimiento as tm", "tm.idTipoMovimiento", "m.idTipoMovimiento")
    .where("m.tipoReferencia", "Nómina")
    .where("m.idReferencia", idEmpleado)
    .whereRaw('LOWER(tm."nombreTipoMovimiento") = ?', ["abono"])
    .select(
      "m.idMovimiento",
      "m.fecha",
      "m.valor",
      "m.observacion",
      "tm.nombreTipoMovimiento"
    );
  if (desde) abonosQuery = abonosQuery.where("m.fecha", ">=", desde);
  if (hasta) abonosQuery = abonosQuery.where("m.fecha", "<=", hasta);
  const abonos = await abonosQuery;

  const abonosFormateados = abonos.map((a) => ({
    ...a,
    fecha: formatFecha(a.fecha),
  }));

  const totalSalidas = abonosFormateados.reduce(
    (sum, m) => sum + Number(m.valor ?? 0),
    0
  );

  return {
    empleado,
    entradas: { items: itemsFormateados, total: totalEntradas },
    salidas: { abonos: abonosFormateados, total: totalSalidas },
    saldo: totalEntradas - totalSalidas,
  };
};

// ─────────────────────────────────────────────
//  Nómina general (resumen por empleado)
// ─────────────────────────────────────────────
export const getNominaResumenTodos = async (fechaInicio, fechaFin) => {
  const empleados = await db("empleado").select("*");

  // Convertir filtros de dd/mm/yyyy → yyyy-mm-dd
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  // Entradas por empleado: suma del valor de sus ítems
  let entradasQuery = db("itemPedido")
    .whereNotNull("idEmpleado")
    .groupBy("idEmpleado")
    .select(
      "idEmpleado",
      db.raw('COALESCE(SUM(valor), 0) as "totalEntradas"')
    );
  if (desde) entradasQuery = entradasQuery.where("fechaEntrega", ">=", desde);
  if (hasta) entradasQuery = entradasQuery.where("fechaEntrega", "<=", hasta);
  const entradasRows = await entradasQuery;

  // Salidas por empleado: suma de abonos (tipoReferencia = 'Nómina')
  let salidasQuery = db("movimiento as m")
    .join("tipoMovimiento as tm", "tm.idTipoMovimiento", "m.idTipoMovimiento")
    .where("m.tipoReferencia", "Nómina")
    .whereRaw('LOWER(tm."nombreTipoMovimiento") = ?', ["abono"])
    .groupBy("m.idReferencia")
    .select(
      "m.idReferencia as idEmpleado",
      db.raw('COALESCE(SUM(m.valor), 0) as "totalSalidas"')
    );
  if (desde) salidasQuery = salidasQuery.where("m.fecha", ">=", desde);
  if (hasta) salidasQuery = salidasQuery.where("m.fecha", "<=", hasta);
  const salidasRows = await salidasQuery;

  const entradasMap = Object.fromEntries(
    entradasRows.map((r) => [r.idEmpleado, Number(r.totalEntradas)])
  );
  const salidasMap = Object.fromEntries(
    salidasRows.map((r) => [r.idEmpleado, Number(r.totalSalidas)])
  );

  return empleados.map((emp) => {
    const totalEntradas = entradasMap[emp.idEmpleado] ?? 0;
    const totalSalidas = salidasMap[emp.idEmpleado] ?? 0;
    return {
      ...emp,
      totalEntradas,
      totalSalidas,
      saldo: totalEntradas - totalSalidas,
    };
  });
};
