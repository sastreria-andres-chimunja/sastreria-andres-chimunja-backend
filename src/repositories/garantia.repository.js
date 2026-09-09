import db from "../config/database.js";
import { parseFecha, formatFecha, diaSiguiente } from "../utils/date.utils.js";
import { mayus } from "../utils/text.utils.js";

const TABLE = "garantia";

const BASE_QUERY = (qb = db) =>
  qb(TABLE)
    .leftJoin("empleado as emp", "emp.idEmpleado", `${TABLE}.idEmpleado`)
    .select(
      `${TABLE}.*`,
      qb.raw(`emp.nombres || ' ' || emp.apellidos as "nombreEmpleado"`)
    );

const formatGarantia = (g) => (g ? { ...g, fecha: formatFecha(g.fecha) } : null);

/**
 * Registra una garantía: cliente + valor. El mismo valor se contabiliza UNA
 * sola vez como gasto real del negocio (movimiento, categoría "Garantías")
 * -- ver nota en la migración 20260909000001_create_garantia.js sobre por
 * qué no se genera un segundo movimiento cuando se liquide en la nómina del
 * empleado (ese "pagado" es solo reconocimiento en su nómina, no un
 * segundo desembolso).
 */
export const createGarantia = async (idEmpleado, nombreCliente, valor) => {
  return db.transaction(async (trx) => {
    const [garantia] = await trx(TABLE)
      .insert({ idEmpleado, nombreCliente: mayus(nombreCliente), valor })
      .returning("*");

    const empleado = await trx("empleado").where({ idEmpleado }).first();
    const categoria = await trx("categoriaMovimiento")
      .where({ nombreCategoriaMovimiento: "Garantías" })
      .first();
    const tipoSalida = await trx("tipoMovimiento")
      .whereRaw("LOWER(\"nombreTipoMovimiento\") like '%salida%'")
      .first();

    await trx("movimiento").insert({
      idTipoMovimiento: tipoSalida?.idTipoMovimiento ?? 2,
      idCategoriaMovimiento: categoria?.idCategoriaMovimiento ?? null,
      idMetodoPago: null,
      valor,
      tipoReferencia: "garantia",
      idReferencia: garantia.idGarantia,
      observacion: mayus(
        `Garantía — cliente: ${nombreCliente} (reportada por ${empleado?.nombres ?? ""} ${empleado?.apellidos ?? ""})`
      ),
      fecha: garantia.fecha,
    });

    return formatGarantia(garantia);
  });
};

export const listarGarantias = async (fechaInicio, fechaFin, idEmpleado) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let query = BASE_QUERY().orderBy(`${TABLE}.fecha`, "desc");
  if (idEmpleado) query = query.where(`${TABLE}.idEmpleado`, idEmpleado);
  if (desde) query = query.where(`${TABLE}.fecha`, ">=", desde);
  if (hasta) query = query.where(`${TABLE}.fecha`, "<", diaSiguiente(hasta));

  const garantias = await query;
  return garantias.map(formatGarantia);
};

// ── Usadas desde nomina.repository.js para incorporar las garantías
// pendientes/pagadas de un empleado a su nómina (ver notas ahí). ──

export const getGarantiasPorEmpleado = async (idEmpleado, fechaInicio, fechaFin, pagado) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let query = db(TABLE).where({ idEmpleado });
  if (pagado !== undefined) query = query.where({ pagado });
  if (desde) query = query.where("fecha", ">=", desde);
  if (hasta) query = query.where("fecha", "<", diaSiguiente(hasta));

  const garantias = await query.orderBy("fecha", "desc");
  return garantias.map(formatGarantia);
};

/** Suma de garantías pendientes de todos los empleados, agrupada por
 * idEmpleado -- para el listado general de nómina (getNominaResumenTodos). */
export const getTotalGarantiasPendientesPorEmpleado = async (fechaInicio, fechaFin) => {
  const desde = parseFecha(fechaInicio);
  const hasta = parseFecha(fechaFin);

  let query = db(TABLE)
    .where({ pagado: false })
    .groupBy("idEmpleado")
    .select("idEmpleado", db.raw('COALESCE(SUM(valor), 0) as total'));
  if (desde) query = query.where("fecha", ">=", desde);
  if (hasta) query = query.where("fecha", "<", diaSiguiente(hasta));

  return query;
};

/** Marca como pagadas TODAS las garantías pendientes de un empleado (sin
 * filtro de fecha, misma acción masiva que liquidarNomina() para ítems) --
 * usa el mismo `trx` para que quede atado a la misma transacción. */
export const marcarGarantiasPagadas = async (idEmpleado, trx = db) => {
  const pendientes = await trx(TABLE).where({ idEmpleado, pagado: false }).select("*");
  if (pendientes.length === 0) return [];
  await trx(TABLE).where({ idEmpleado, pagado: false }).update({ pagado: true });
  return pendientes.map(formatGarantia);
};
