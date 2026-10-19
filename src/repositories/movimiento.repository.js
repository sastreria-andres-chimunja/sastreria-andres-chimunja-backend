import db from "../config/database.js";
import { parseFecha, formatFecha, diaSiguiente } from "../utils/date.utils.js";
import { mayus } from "../utils/text.utils.js";

const TABLE = "movimiento";

const formatMovimiento = (m) =>
  m ? { ...m, fecha: formatFecha(m.fecha) } : null;

// Resuelve el nombre del cliente cuando el movimiento referencia un pedido
// (tipoReferencia='pedido', idReferencia=idPedido) o un ítem de pedido
// (tipoReferencia='itemPedido', idReferencia=idItemPedido) — patrón FK
// polimórfico de la tabla, así que se resuelve con subconsultas correlacionadas.
const NOMBRE_CLIENTE_REFERENCIA = `(
  SELECT cl.nombres || ' ' || cl.apellidos
  FROM pedido p
  JOIN cliente cl ON cl."idCliente" = p."idCliente"
  WHERE p."idPedido" = "${TABLE}"."idReferencia" AND "${TABLE}"."tipoReferencia" = 'pedido'
  UNION ALL
  SELECT cl.nombres || ' ' || cl.apellidos
  FROM "itemPedido" ip
  JOIN pedido p ON p."idPedido" = ip."idPedido"
  JOIN cliente cl ON cl."idCliente" = p."idCliente"
  WHERE ip."idItemPedido" = "${TABLE}"."idReferencia" AND "${TABLE}"."tipoReferencia" = 'itemPedido'
  LIMIT 1
) as "nombreClienteReferencia"`;

const RICH_QUERY = () =>
  db(TABLE)
    .leftJoin("tipoMovimiento as tm", "tm.idTipoMovimiento", `${TABLE}.idTipoMovimiento`)
    .leftJoin("categoriaMovimiento as cm", "cm.idCategoriaMovimiento", `${TABLE}.idCategoriaMovimiento`)
    .leftJoin("metodoPago as mp", "mp.idMetodoPago", `${TABLE}.idMetodoPago`)
    .select(
      `${TABLE}.*`,
      "tm.nombreTipoMovimiento",
      "cm.nombreCategoriaMovimiento",
      "mp.nombreMetodoPago",
      db.raw(NOMBRE_CLIENTE_REFERENCIA)
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
  // "fecha" es timestamp (con hora) -- "<" al día siguiente incluye todo
  // el día "hasta", no solo hasta medianoche (ver diaSiguiente()).
  if (hasta) query = query.where(`${TABLE}.fecha`, "<", diaSiguiente(hasta));

  // Filtro por categoría lógica para los tabs del frontend
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
  } else if (categoria === "creditos") {
    // Tab "Créditos": pedidos pagados (total o parcialmente) con método
    // "Crédito" -- en la práctica, casi siempre el abono automático que se
    // genera al marcar el pedido como Entregado con saldo pendiente y el
    // admin elige "Crédito" en el diálogo de confirmación. "cr_dito" (guion
    // bajo = comodín de 1 char) para que matchee "Crédito"/"Credito" sin
    // depender de tildes -- mismo truco ya usado en otras consultas de este
    // archivo (ver "n%mina" en categoriaMovimiento).
    query = query
      .whereIn(`${TABLE}.tipoReferencia`, ["itemPedido", "pedido", "Pedidos", "Ventas"])
      .whereRaw("LOWER(mp.\"nombreMetodoPago\") LIKE '%cr_dito%'");
  } else if (categoria === "transferencias") {
    // Tab "Transferencias": pedidos pagados con cualquier método que NO sea
    // Efectivo ni Crédito (Nequi, Daviplata, Llaves, Transferencia, etc. --
    // todo lo "digital"/no físico). Se excluyen los movimientos sin método
    // registrado (idMetodoPago null) -- no son transferencias, son datos
    // viejos/sin especificar, y meterlos acá los representaría mal.
    query = query
      .whereIn(`${TABLE}.tipoReferencia`, ["itemPedido", "pedido", "Pedidos", "Ventas"])
      .whereNotNull(`${TABLE}.idMetodoPago`)
      .whereRaw("LOWER(mp.\"nombreMetodoPago\") NOT LIKE '%efectivo%'")
      .whereRaw("LOWER(mp.\"nombreMetodoPago\") NOT LIKE '%cr_dito%'");
  }

  const movimientos = await query;
  return movimientos.map(formatMovimiento);
};

// Balance de caja de un día puntual: todo ingreso (idTipoMovimiento=1),
// cualquier categoría/referencia, agrupado por método de pago -- para el
// botón "Balance del día" de Movimientos.
export const getBalanceDia = async (fecha) => {
  const desde = parseFecha(fecha);
  const hasta = diaSiguiente(desde);

  const filas = await db(TABLE)
    .leftJoin("metodoPago as mp", "mp.idMetodoPago", `${TABLE}.idMetodoPago`)
    .where(`${TABLE}.idTipoMovimiento`, 1)
    .where(`${TABLE}.fecha`, ">=", desde)
    .where(`${TABLE}.fecha`, "<", hasta)
    .groupBy("mp.idMetodoPago", "mp.nombreMetodoPago")
    .select(
      "mp.idMetodoPago",
      db.raw(`COALESCE(mp."nombreMetodoPago", 'Sin método') as "nombreMetodoPago"`),
      db.raw(`COALESCE(SUM("${TABLE}".valor), 0) as total`),
      db.raw(`COUNT(*) as cantidad`)
    )
    .orderByRaw("total desc");

  const porMetodoPago = filas.map((f) => ({
    idMetodoPago: f.idMetodoPago,
    nombreMetodoPago: f.nombreMetodoPago,
    total: Number(f.total),
    cantidad: Number(f.cantidad),
  }));
  const total = porMetodoPago.reduce((acc, f) => acc + f.total, 0);

  return { fecha: formatFecha(desde), porMetodoPago, total };
};

const soloColumnasTabla = (movimiento, fechaDefault = null) => ({
  valor:                 movimiento.valor,
  fecha:                 movimiento.fecha ? parseFecha(movimiento.fecha) : (fechaDefault ?? db.fn.now()),
  idTipoMovimiento:      movimiento.idTipoMovimiento,
  idCategoriaMovimiento: movimiento.idCategoriaMovimiento,
  idMetodoPago:          movimiento.idMetodoPago ?? null,
  tipoReferencia:        movimiento.tipoReferencia ?? null,
  idReferencia:          movimiento.idReferencia ?? null,
  observacion:           mayus(movimiento.observacion) ?? null,
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

/**
 * Marca un crédito pendiente como pagado: NO crea un movimiento nuevo --
 * el movimiento del crédito YA es un ingreso (se registra como tal desde
 * que se consolida con método "Crédito" al entregar el pedido, ver
 * manejarCambioEstadoPedido() en pedido.repository.js), así que crear otro
 * duplicaría el ingreso en los reportes. En vez de eso, se le cambia el
 * método de pago al que realmente se usó para cobrarlo -- con eso el
 * mismo movimiento deja de aparecer en el tab/listado de "Créditos"
 * (que filtra por método = Crédito) y pasa a verse en Movimientos bajo su
 * método real, como cualquier otro ingreso ya cobrado. Se deja un rastro
 * en la observación de que fue un crédito y cuándo se pagó.
 */
export const pagarCredito = async (idMovimiento, idMetodoPagoNuevo) => {
  const mov = await db(TABLE).where({ idMovimiento }).first();
  if (!mov) throw new Error("Movimiento no encontrado.");

  const metodoActual = mov.idMetodoPago
    ? await db("metodoPago").where({ idMetodoPago: mov.idMetodoPago }).first()
    : null;
  if (!metodoActual || !/cr.dito/i.test(metodoActual.nombreMetodoPago ?? "")) {
    throw new Error("Este movimiento no es un crédito pendiente.");
  }

  const metodoNuevo = await db("metodoPago").where({ idMetodoPago: idMetodoPagoNuevo }).first();
  if (!metodoNuevo) throw new Error("Selecciona un método de pago válido.");
  if (/cr.dito/i.test(metodoNuevo.nombreMetodoPago ?? "")) {
    throw new Error("Selecciona un método de pago distinto a Crédito para darlo de baja.");
  }

  const hoy = new Date().toLocaleDateString("es-CO");
  const observacion = mayus(
    `${mov.observacion ?? ""} -- CRÉDITO PAGADO EL ${hoy} (ERA: ${metodoActual.nombreMetodoPago})`.trim()
  );

  await db(TABLE).where({ idMovimiento }).update({ idMetodoPago: idMetodoPagoNuevo, observacion });
  return getMovimientoById(idMovimiento);
};

/** Créditos pendientes (sin pagar) -- mismo filtro que el tab "Créditos" de Movimientos. */
export const getCreditosPendientes = async () => {
  const movimientos = await RICH_QUERY()
    .whereIn(`${TABLE}.tipoReferencia`, ["itemPedido", "pedido", "Pedidos", "Ventas"])
    .whereRaw("LOWER(mp.\"nombreMetodoPago\") LIKE '%cr_dito%'")
    .orderBy(`${TABLE}.fecha`, "desc");
  return movimientos.map(formatMovimiento);
};

export const deleteMovimiento = async (idMovimiento) => {
  const mov = await db(TABLE).where({ idMovimiento }).first();
  // El abono que se consolida solo al marcar un pedido como Entregado
  // (autoGenerado=true) no se puede borrar por acá -- borrarlo directo
  // dejaría el pedido con fechaEntregado sellada pero sin el abono que la
  // acompaña (estado inconsistente). Para eso ya existe "Revertir" en la
  // Hoja de trabajo, que deshace las dos cosas juntas (ver
  // manejarCambioEstadoPedido() en pedido.repository.js).
  if (mov?.autoGenerado) {
    throw new Error(
      "Este abono se generó automáticamente al marcar el pedido como Entregado -- usa \"Revertir\" en la Hoja de trabajo en vez de eliminarlo directamente."
    );
  }
  return db(TABLE).where({ idMovimiento }).del();
};
