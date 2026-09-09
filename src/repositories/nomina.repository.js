import db from "../config/database.js";
import { parseFecha, formatFecha, diaSiguiente } from "../utils/date.utils.js";
import * as garantiaRepository from "./garantia.repository.js";

// Excluye ítems cuyo pedido esté marcado "No realizado" — esos pedidos no
// deben contar para la nómina de ningún empleado.
const excluirPedidosNoRealizados = (query, aliasItem = "ip") =>
  query.whereNotExists(
    db("pedido as pnr")
      .join("estado as enr", "enr.idEstado", "pnr.idEstado")
      .whereRaw(`pnr."idPedido" = "${aliasItem}"."idPedido"`)
      .whereRaw("LOWER(enr.nombre) = 'no realizado'")
  );

// ─────────────────────────────────────────────
//  Resumen por período (por fecha en que el ítem pasó a Terminado)
// ─────────────────────────────────────────────
// A diferencia del modo "normal" de getNominaEmpleado (que filtra por
// fecha de entrega) o su modo "historial" (que filtra por fecha de pago),
// esto refleja cuándo el empleado REALMENTE completó el trabajo --
// fechaEntrega la fija el admin de antemano y puede no coincidir con el
// día real de trabajo; la fecha de pago depende de cuándo el admin
// liquida, que puede ser mucho después. Es la única vista donde
// "Facturado", "Pendiente de pago" y "Saldo" están genuinamente atados al
// mismo filtro de fecha (antes eran dos filtros distintos sin relación,
// lo que confundía -- un ítem podía "desaparecer" de un número sin
// desaparecer del otro). Ítems marcados Terminado antes de que existiera
// la columna fechaTerminado no tienen fecha (no se fabricó una fecha
// retroactiva) y por lo tanto no aparecen acá hasta que se toquen de nuevo.
export const getResumenPeriodo = async (idEmpleado, fechaInicio, fechaFin) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let itemsQuery = excluirPedidosNoRealizados(
    db("itemPedido as ip").where("ip.idEmpleado", idEmpleado).whereNotNull("ip.fechaTerminado")
  ).select(
    "ip.idItemPedido", "ip.idPedido", "ip.descripcion", "ip.valor",
    "ip.comisionEmpleado", "ip.fechaTerminado", "ip.pagado"
  );
  if (desde) itemsQuery = itemsQuery.where("ip.fechaTerminado", ">=", desde);
  // "fechaTerminado" es timestamp -- "<" al día siguiente para incluir
  // todo el día "hasta" completo (ver diaSiguiente()).
  if (hasta) itemsQuery = itemsQuery.where("ip.fechaTerminado", "<", diaSiguiente(hasta));
  const items = await itemsQuery.orderBy("ip.fechaTerminado", "desc");

  const itemsFormateados = items.map((i) => {
    const valorEmpleado = Number(i.valor ?? 0) * Number(i.comisionEmpleado ?? 0) / 100;
    return { ...i, fechaTerminado: formatFecha(i.fechaTerminado), valorEmpleado };
  });

  // Garantías reportadas por el empleado en el mismo período (mismo
  // criterio de fecha que los ítems, ver garantia.repository.js) -- cuentan
  // como "entrada" propia en su nómina, con el valor completo (no hay
  // comisión: es reconocimiento por rehacer el trabajo sin cobrarle al
  // cliente, no un ítem con precio de venta).
  const garantias = await garantiaRepository.getGarantiasPorEmpleado(idEmpleado, fechaInicio, fechaFin);
  const garantiasFormateadas = garantias.map((g) => ({
    idGarantia: g.idGarantia,
    descripcion: `Garantía — ${g.nombreCliente}`,
    valorEmpleado: Number(g.valor ?? 0),
    fechaTerminado: g.fecha,
    pagado: g.pagado,
    _esGarantia: true,
  }));

  const todasEntradas = [...itemsFormateados, ...garantiasFormateadas];
  const pendientes = todasEntradas.filter((i) => !i.pagado);
  const pagados = todasEntradas.filter((i) => i.pagado);
  const facturado = todasEntradas.reduce((s, i) => s + i.valorEmpleado, 0);
  const totalPendiente = pendientes.reduce((s, i) => s + i.valorEmpleado, 0);
  const totalPagadoItems = pagados.reduce((s, i) => s + i.valorEmpleado, 0);

  // Abonos (adelantos) fechados dentro del mismo período.
  let abonosQuery = db("movimiento as m")
    .join("tipoMovimiento as tm", "tm.idTipoMovimiento", "m.idTipoMovimiento")
    .whereIn("m.tipoReferencia", ["Nómina", "empleado"])
    .where("m.idReferencia", idEmpleado)
    .where("m.idTipoMovimiento", 2)
    .select("m.idMovimiento", "m.fecha", "m.valor", "m.observacion", "tm.nombreTipoMovimiento");
  if (desde) abonosQuery = abonosQuery.where("m.fecha", ">=", desde);
  if (hasta) abonosQuery = abonosQuery.where("m.fecha", "<", diaSiguiente(hasta));
  const abonos = await abonosQuery.orderBy("m.fecha", "desc");
  const abonosFormateados = abonos.map((a) => ({ ...a, fecha: formatFecha(a.fecha) }));
  const totalAbonos = abonosFormateados.reduce((s, a) => s + Number(a.valor ?? 0), 0);

  return {
    pendientes,
    pagados,
    abonos: abonosFormateados,
    facturado,
    totalPendiente,
    totalPagadoItems,
    totalAbonos,
    saldo: totalPendiente - totalAbonos,
  };
};

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
    // "m.fecha" es timestamp -- "<" al día siguiente para incluir todo el
    // día "hasta" (ver diaSiguiente()), no solo hasta medianoche.
    if (hasta) pagosQuery = pagosQuery.where("m.fecha", "<", diaSiguiente(hasta));
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
    if (hasta) abonosQuery = abonosQuery.where("m.fecha", "<", diaSiguiente(hasta));
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

  let itemsQuery = excluirPedidosNoRealizados(
    db("itemPedido as ip")
      .leftJoin("pedido as p", "p.idPedido", "ip.idPedido")
      .join("estado as est", "est.idEstado", "ip.idEstado")
      .where("ip.idEmpleado", idEmpleado)
      .where("ip.pagado", false)
      .whereRaw("LOWER(est.nombre) = 'terminado'")
  ).select(
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
  // Por fecha en que el ítem pasó a Terminado, no de entrega -- mismo
  // criterio que getResumenPeriodo()/getNominaResumenTodos().
  if (desde) itemsQuery = itemsQuery.where("ip.fechaTerminado", ">=", desde);
  if (hasta) itemsQuery = itemsQuery.where("ip.fechaTerminado", "<", diaSiguiente(hasta));
  const items = await itemsQuery;

  const itemsFormateados = items.map((item) => {
    const valorEmpleado = Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100;
    return { ...item, fechaEntrega: formatFecha(item.fechaEntrega), fechaRecibido: formatFecha(item.fechaRecibido), valorEmpleado };
  });

  // Garantías pendientes de reconocer en su nómina (ver getResumenPeriodo()).
  const garantiasPendientes = await garantiaRepository.getGarantiasPorEmpleado(idEmpleado, fechaInicio, fechaFin, false);
  const garantiasFormateadas = garantiasPendientes.map((g) => ({
    idGarantia: g.idGarantia,
    descripcion: `Garantía — ${g.nombreCliente}`,
    valorEmpleado: Number(g.valor ?? 0),
    fechaEntrega: g.fecha,
    _esGarantia: true,
  }));

  const entradasFormateadas = [...itemsFormateados, ...garantiasFormateadas];
  const totalEntradas = entradasFormateadas.reduce((sum, item) => sum + item.valorEmpleado, 0);

  // Solo abonos que aún no han sido liquidados
  let abonosQuery = db("movimiento as m")
    .join("tipoMovimiento as tm", "tm.idTipoMovimiento", "m.idTipoMovimiento")
    .whereIn("m.tipoReferencia", ["Nómina", "empleado"])
    .where("m.idReferencia", idEmpleado)
    .where("m.idTipoMovimiento", 2)
    .where("m.liquidado", false)
    .select("m.idMovimiento", "m.fecha", "m.valor", "m.observacion", "tm.nombreTipoMovimiento");
  if (desde) abonosQuery = abonosQuery.where("m.fecha", ">=", desde);
  if (hasta) abonosQuery = abonosQuery.where("m.fecha", "<", diaSiguiente(hasta));
  const abonos = await abonosQuery;

  const abonosFormateados = abonos.map((a) => ({ ...a, fecha: formatFecha(a.fecha) }));
  const totalSalidas = abonosFormateados.reduce((sum, m) => sum + Number(m.valor ?? 0), 0);

  return {
    empleado,
    entradas: { items: entradasFormateadas, total: totalEntradas },
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
  const items = await excluirPedidosNoRealizados(
    db("itemPedido as ip")
      .join("estado as est", "est.idEstado", "ip.idEstado")
      .where("ip.idEmpleado", idEmpleado)
      .where("ip.pagado", false)
      .whereRaw("LOWER(est.nombre) = 'terminado'")
  ).select("ip.*");

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

  // Garantías pendientes: se marcan pagadas (reconocidas en su nómina) sin
  // generar un segundo movimiento -- el gasto real ya se registró una sola
  // vez al crear cada garantía (ver garantia.repository.js).
  const garantiasLiquidadas = await garantiaRepository.marcarGarantiasPagadas(idEmpleado);

  const totalPagado =
    items.reduce((sum, i) => sum + Number(i.valor ?? 0) * Number(i.comisionEmpleado ?? 0) / 100, 0) +
    garantiasLiquidadas.reduce((sum, g) => sum + Number(g.valor ?? 0), 0);

  // Se devuelve también el detalle mínimo de los ítems pagados -- lo usa el
  // frontend para armar el comprobante (ticket/PDF/WhatsApp) de "Pagar todo",
  // igual que ya hace con el pago de un ítem individual.
  const itemsDetalle = items.map((i) => ({
    idItemPedido: i.idItemPedido,
    idPedido: i.idPedido,
    descripcion: i.descripcion,
    valor: Number(i.valor ?? 0),
    comisionEmpleado: Number(i.comisionEmpleado ?? 0),
  }));

  return {
    itemsPagados: items.length,
    garantiasPagadas: garantiasLiquidadas.length,
    abonosLiquidados,
    totalPagado,
    items: itemsDetalle,
  };
};

// ─────────────────────────────────────────────
//  Nómina general (resumen por empleado)
// ─────────────────────────────────────────────
export const getNominaResumenTodos = async (fechaInicio, fechaFin) => {
  // Empleados inactivos no deben aparecer en el listado general de nómina
  // (ya no trabajan ahí, no tiene sentido seguir liquidándoles) -- si
  // llegaran a tener saldo pendiente sin liquidar, se sigue viendo desde
  // su propio detalle/historial, solo se quita del listado general.
  const empleados = await db("empleado").where({ activo: true }).select("*");

  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let entradasQuery = excluirPedidosNoRealizados(
    db("itemPedido as ip")
      .join("estado as est", "est.idEstado", "ip.idEstado")
      .whereNotNull("ip.idEmpleado")
      .where("ip.pagado", false)
      .whereRaw("LOWER(est.nombre) = 'terminado'")
  )
    .groupBy("ip.idEmpleado")
    .select(
      "ip.idEmpleado",
      db.raw('COALESCE(SUM(ip.valor * ip."comisionEmpleado" / 100.0), 0) as "totalEntradas"')
    );
  // Por fecha en que el ítem pasó a Terminado (fecha real de trabajo), no
  // de entrega -- mismo criterio que getResumenPeriodo(), para que el
  // listado general y el detalle de cada empleado muestren números
  // consistentes bajo el mismo filtro de fecha. "fechaTerminado" es
  // timestamp -- "<" al día siguiente para incluir todo el día "hasta".
  if (desde) entradasQuery = entradasQuery.where("ip.fechaTerminado", ">=", desde);
  if (hasta) entradasQuery = entradasQuery.where("ip.fechaTerminado", "<", diaSiguiente(hasta));
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
  if (hasta) salidasQuery = salidasQuery.where("m.fecha", "<", diaSiguiente(hasta));
  const salidasRows = await salidasQuery;

  // Garantías pendientes de cada empleado, mismo criterio de fecha.
  const garantiasRows = await garantiaRepository.getTotalGarantiasPendientesPorEmpleado(fechaInicio, fechaFin);

  const entradasMap = Object.fromEntries(entradasRows.map((r) => [r.idEmpleado, Number(r.totalEntradas)]));
  const salidasMap = Object.fromEntries(salidasRows.map((r) => [r.idEmpleado, Number(r.totalSalidas)]));
  const garantiasMap = Object.fromEntries(garantiasRows.map((r) => [r.idEmpleado, Number(r.total)]));

  return empleados.map((emp) => {
    const totalEntradas = (entradasMap[emp.idEmpleado] ?? 0) + (garantiasMap[emp.idEmpleado] ?? 0);
    const totalSalidas = salidasMap[emp.idEmpleado] ?? 0;
    return { ...emp, totalEntradas, totalSalidas, saldo: totalEntradas - totalSalidas };
  });
};
