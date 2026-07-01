import db from "../config/database.js";
import { parseFecha, formatFecha } from "../utils/date.utils.js";

// ─────────────────────────────────────────────
//  Nómina individual
// ─────────────────────────────────────────────
export const getNominaEmpleado = async (idEmpleado, fechaInicio, fechaFin, historial = false) => {
  const empleado = await db("empleado").where({ idEmpleado }).first();
  if (!empleado) return null;

  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  if (historial) {
    // ── Modo historial: muestra lo que SE PAGÓ en el período (cuenta cruzada) ──

    // Entradas: movimientos nomina_item creados al pagar cada ítem
    let pagosQuery = db("movimiento as m")
      .where("m.tipoReferencia", "nomina_item")
      .where("m.idReferencia", idEmpleado)
      .orderBy("m.fecha", "desc")
      .select("m.idMovimiento", "m.observacion", "m.valor", "m.fecha");
    if (desde) pagosQuery = pagosQuery.where("m.fecha", ">=", desde);
    if (hasta) pagosQuery = pagosQuery.where("m.fecha", "<=", hasta);
    const pagos = await pagosQuery;

    const pagosFormateados = pagos.map((p) => ({ ...p, fecha: formatFecha(p.fecha) }));
    const totalEntradas = pagosFormateados.reduce((sum, p) => sum + Number(p.valor ?? 0), 0);

    // Salidas: todos los abonos del período (incluye liquidados para ver el historial completo)
    let abonosQuery = db("movimiento as m")
      .join("tipoMovimiento as tm", "tm.idTipoMovimiento", "m.idTipoMovimiento")
      .whereIn("m.tipoReferencia", ["Nómina", "empleado"])
      .where("m.idReferencia", idEmpleado)
      .where("m.idTipoMovimiento", 2)
      .orderBy("m.fecha", "desc")
      .select("m.idMovimiento", "m.fecha", "m.valor", "m.observacion", "m.liquidado", "tm.nombreTipoMovimiento");
    if (desde) abonosQuery = abonosQuery.where("m.fecha", ">=", desde);
    if (hasta) abonosQuery = abonosQuery.where("m.fecha", "<=", hasta);
    const abonos = await abonosQuery;

    const abonosFormateados = abonos.map((a) => ({ ...a, fecha: formatFecha(a.fecha) }));
    const totalSalidas = abonosFormateados.reduce((sum, a) => sum + Number(a.valor ?? 0), 0);

    return {
      empleado,
      entradas: { pagos: pagosFormateados, total: totalEntradas },
      salidas: { abonos: abonosFormateados, total: totalSalidas },
      saldo: totalEntradas - totalSalidas,
      esHistorial: true,
    };
  }

  // ── Modo normal: ítems pendientes de pago + abonos aún no liquidados ──

  let itemsQuery = db("itemPedido as ip")
    .leftJoin("pedido as p", "p.idPedido", "ip.idPedido")
    .join("estado as est", "est.idEstado", "ip.idEstado")
    .where("ip.idEmpleado", idEmpleado)
    .where("ip.pagado", false)
    .whereRaw("LOWER(est.nombre) = 'terminado'")
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

  const itemsFormateados = items.map((item) => {
    const valorEmpleado = Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100;
    return { ...item, fechaEntrega: formatFecha(item.fechaEntrega), fechaRecibido: formatFecha(item.fechaRecibido), valorEmpleado };
  });

  const totalEntradas = itemsFormateados.reduce((sum, item) => sum + item.valorEmpleado, 0);

  // Solo abonos que aún no han sido liquidados
  let abonosQuery = db("movimiento as m")
    .join("tipoMovimiento as tm", "tm.idTipoMovimiento", "m.idTipoMovimiento")
    .whereIn("m.tipoReferencia", ["Nómina", "empleado"])
    .where("m.idReferencia", idEmpleado)
    .where("m.idTipoMovimiento", 2)
    .where("m.liquidado", false)
    .select("m.idMovimiento", "m.fecha", "m.valor", "m.observacion", "tm.nombreTipoMovimiento");
  if (desde) abonosQuery = abonosQuery.where("m.fecha", ">=", desde);
  if (hasta) abonosQuery = abonosQuery.where("m.fecha", "<=", hasta);
  const abonos = await abonosQuery;

  const abonosFormateados = abonos.map((a) => ({ ...a, fecha: formatFecha(a.fecha) }));
  const totalSalidas = abonosFormateados.reduce((sum, m) => sum + Number(m.valor ?? 0), 0);

  return {
    empleado,
    entradas: { items: itemsFormateados, total: totalEntradas },
    salidas: { abonos: abonosFormateados, total: totalSalidas },
    saldo: totalEntradas - totalSalidas,
    esHistorial: false,
  };
};

// ─────────────────────────────────────────────
//  Liquidar nómina de un empleado
//  Paga todos los ítems pendientes y marca los abonos como liquidados.
// ─────────────────────────────────────────────
export const liquidarNomina = async (idEmpleado) => {
  const tipoSalida = await db("tipoMovimiento")
    .whereRaw("LOWER(\"nombreTipoMovimiento\") like '%salida%'")
    .first();
  const catNomina = await db("categoriaMovimiento")
    .whereRaw("LOWER(\"nombreCategoriaMovimiento\") like '%n%mina%'")
    .first();

  // Ítems pendientes del empleado con estado "Terminado"
  const items = await db("itemPedido as ip")
    .join("estado as est", "est.idEstado", "ip.idEstado")
    .where("ip.idEmpleado", idEmpleado)
    .where("ip.pagado", false)
    .whereRaw("LOWER(est.nombre) = 'terminado'")
    .select("ip.*");

  for (const item of items) {
    await db("itemPedido").where({ idItemPedido: item.idItemPedido }).update({ pagado: true });
    const valorEmpleado = Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100;
    await db("movimiento").insert({
      idTipoMovimiento: tipoSalida?.idTipoMovimiento ?? 2,
      idCategoriaMovimiento: catNomina?.idCategoriaMovimiento ?? null,
      idMetodoPago: null,
      valor: valorEmpleado,
      tipoReferencia: "nomina_item",
      idReferencia: idEmpleado,
      observacion: `Pago nómina — Ítem #${item.idItemPedido}: ${item.descripcion ?? ""} (${item.comisionEmpleado ?? 0}%)`,
      fecha: db.fn.now(),
      liquidado: false,
    });
  }

  // Marcar todos los abonos pendientes como liquidados
  const abonosLiquidados = await db("movimiento")
    .whereIn("tipoReferencia", ["Nómina", "empleado"])
    .where("idReferencia", idEmpleado)
    .where("idTipoMovimiento", tipoSalida?.idTipoMovimiento ?? 2)
    .where("liquidado", false)
    .update({ liquidado: true });

  const totalPagado = items.reduce(
    (sum, i) => sum + Number(i.valor ?? 0) * Number(i.comisionEmpleado ?? 0) / 100,
    0
  );

  return { itemsPagados: items.length, abonosLiquidados, totalPagado };
};

// ─────────────────────────────────────────────
//  Nómina general (resumen por empleado)
// ─────────────────────────────────────────────
export const getNominaResumenTodos = async (fechaInicio, fechaFin) => {
  const empleados = await db("empleado").select("*");

  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let entradasQuery = db("itemPedido as ip")
    .join("estado as est", "est.idEstado", "ip.idEstado")
    .whereNotNull("ip.idEmpleado")
    .where("ip.pagado", false)
    .whereRaw("LOWER(est.nombre) = 'terminado'")
    .groupBy("ip.idEmpleado")
    .select(
      "ip.idEmpleado",
      db.raw('COALESCE(SUM(ip.valor * ip."comisionEmpleado" / 100.0), 0) as "totalEntradas"')
    );
  if (desde) entradasQuery = entradasQuery.where("ip.fechaEntrega", ">=", desde);
  if (hasta) entradasQuery = entradasQuery.where("ip.fechaEntrega", "<=", hasta);
  const entradasRows = await entradasQuery;

  // Solo abonos no liquidados para mostrar el saldo real pendiente
  let salidasQuery = db("movimiento as m")
    .whereIn("m.tipoReferencia", ["Nómina", "empleado"])
    .where("m.idTipoMovimiento", 2)
    .where("m.liquidado", false)
    .groupBy("m.idReferencia")
    .select(
      "m.idReferencia as idEmpleado",
      db.raw('COALESCE(SUM(m.valor), 0) as "totalSalidas"')
    );
  if (desde) salidasQuery = salidasQuery.where("m.fecha", ">=", desde);
  if (hasta) salidasQuery = salidasQuery.where("m.fecha", "<=", hasta);
  const salidasRows = await salidasQuery;

  const entradasMap = Object.fromEntries(entradasRows.map((r) => [r.idEmpleado, Number(r.totalEntradas)]));
  const salidasMap = Object.fromEntries(salidasRows.map((r) => [r.idEmpleado, Number(r.totalSalidas)]));

  return empleados.map((emp) => {
    const totalEntradas = entradasMap[emp.idEmpleado] ?? 0;
    const totalSalidas = salidasMap[emp.idEmpleado] ?? 0;
    return { ...emp, totalEntradas, totalSalidas, saldo: totalEntradas - totalSalidas };
  });
};
