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
  UNION ALL
  SELECT cl.nombres || ' ' || cl.apellidos
  FROM movimiento mc
  JOIN pedido p ON p."idPedido" = mc."idReferencia" AND mc."tipoReferencia" = 'pedido'
  JOIN cliente cl ON cl."idCliente" = p."idCliente"
  WHERE mc."idMovimiento" = "${TABLE}"."idReferencia" AND "${TABLE}"."tipoReferencia" = 'credito'
  UNION ALL
  SELECT cl.nombres || ' ' || cl.apellidos
  FROM movimiento mc
  JOIN "itemPedido" ip ON ip."idItemPedido" = mc."idReferencia" AND mc."tipoReferencia" = 'itemPedido'
  JOIN pedido p ON p."idPedido" = ip."idPedido"
  JOIN cliente cl ON cl."idCliente" = p."idCliente"
  WHERE mc."idMovimiento" = "${TABLE}"."idReferencia" AND "${TABLE}"."tipoReferencia" = 'credito'
  LIMIT 1
) as "nombreClienteReferencia"`;

// Créditos: el movimiento con método "Crédito" se crea al entregar el
// pedido y SÍ aparece en Movimientos, pero NO suma al cuadre (la plata
// todavía no entró). Cuando el cliente paga, se crea OTRO movimiento de
// ingreso con el método real y la fecha del pago (tipoReferencia='credito',
// idReferencia = idMovimiento del crédito) -- ese es el que suma, el día en
// que de verdad se cobró. "cr_dito" matchea "Crédito"/"Credito".
const ES_METODO_CREDITO = `LOWER(COALESCE(mp."nombreMetodoPago", '')) LIKE '%cr_dito%'`;
const REF_PEDIDOS = ["itemPedido", "pedido", "Pedidos", "Ventas"];
const CREDITO_PAGADO = `EXISTS (
  SELECT 1 FROM movimiento pc
  WHERE pc."tipoReferencia" = 'credito' AND pc."idReferencia" = "${TABLE}"."idMovimiento"
)`;

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
      db.raw(NOMBRE_CLIENTE_REFERENCIA),
      db.raw(`(${ES_METODO_CREDITO}) as "esCredito"`),
      db.raw(`${CREDITO_PAGADO} as "creditoPagado"`)
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
    query = query.whereIn(`${TABLE}.tipoReferencia`, [...REF_PEDIDOS, "credito"]);
  } else if (categoria === "nomina") {
    query = query.whereIn(`${TABLE}.tipoReferencia`, ["empleado", "Nómina", "nomina_item"]);
  } else if (categoria === "gastos") {
    query = query.where(function () {
      this.whereNull(`${TABLE}.tipoReferencia`).orWhereNotIn(`${TABLE}.tipoReferencia`, [
        ...REF_PEDIDOS, "credito", "empleado", "Nómina", "nomina_item",
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
      .whereIn(`${TABLE}.tipoReferencia`, REF_PEDIDOS)
      .whereRaw(ES_METODO_CREDITO);
  } else if (categoria === "transferencias") {
    // Tab "Transferencias": pedidos pagados con cualquier método que NO sea
    // Efectivo ni Crédito (Nequi, Daviplata, Llaves, Transferencia, etc. --
    // todo lo "digital"/no físico). Se excluyen los movimientos sin método
    // registrado (idMetodoPago null) -- no son transferencias, son datos
    // viejos/sin especificar, y meterlos acá los representaría mal.
    query = query
      .whereIn(`${TABLE}.tipoReferencia`, [...REF_PEDIDOS, "credito"])
      .whereNotNull(`${TABLE}.idMetodoPago`)
      .whereRaw("LOWER(mp.\"nombreMetodoPago\") NOT LIKE '%efectivo%'")
      .whereRaw("LOWER(mp.\"nombreMetodoPago\") NOT LIKE '%cr_dito%'");
  }

  const movimientos = await query;
  return movimientos.map(formatMovimiento);
};

// Balance de caja de un día puntual: todo ingreso (idTipoMovimiento=1),
// cualquier categoría/referencia, agrupado por método de pago -- para el
// botón "Balance del día" de Movimientos. Los créditos (método "Crédito")
// no suman: la plata entra el día en que se pagan (ver ES_METODO_CREDITO).
export const getBalanceDia = async (fecha) => {
  const desde = parseFecha(fecha);
  const hasta = diaSiguiente(desde);

  const filas = await db(TABLE)
    .leftJoin("metodoPago as mp", "mp.idMetodoPago", `${TABLE}.idMetodoPago`)
    .where(`${TABLE}.idTipoMovimiento`, 1)
    .whereRaw(`NOT (${ES_METODO_CREDITO})`)
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
 * Paga un crédito pendiente (siempre completo, no hay abonos parciales):
 * crea un movimiento de INGRESO nuevo con el método real con que se cobró
 * y la fecha de hoy (tipoReferencia='credito', idReferencia = idMovimiento
 * del crédito). El movimiento original del crédito se deja intacto, con
 * método "Crédito" -- sigue apareciendo en Movimientos como registro de
 * que se entregó a crédito, pero nunca suma al cuadre; el que suma es este
 * pago nuevo, el día en que de verdad entró la plata.
 * (Antes se le cambiaba el método al movimiento del crédito, que conservaba
 * la fecha de entrega -- el pago terminaba sumando al cuadre de ese día
 * pasado en vez del día del cobro.)
 */
export const pagarCredito = async (idMovimiento, idMetodoPagoNuevo) => {
  return db.transaction(async (trx) => {
    const mov = await trx(TABLE).where({ idMovimiento }).forUpdate().first();
    if (!mov) throw new Error("Movimiento no encontrado.");

    const metodoActual = mov.idMetodoPago
      ? await trx("metodoPago").where({ idMetodoPago: mov.idMetodoPago }).first()
      : null;
    if (!metodoActual || !/cr.dito/i.test(metodoActual.nombreMetodoPago ?? "")) {
      throw new Error("Este movimiento no es un crédito.");
    }
    const yaPagado = await trx(TABLE).where({ tipoReferencia: "credito", idReferencia: idMovimiento }).first();
    if (yaPagado) throw new Error("Este crédito ya fue pagado.");

    const metodoNuevo = await trx("metodoPago").where({ idMetodoPago: idMetodoPagoNuevo }).first();
    if (!metodoNuevo) throw new Error("Selecciona un método de pago válido.");
    if (/cr.dito/i.test(metodoNuevo.nombreMetodoPago ?? "")) {
      throw new Error("Selecciona un método de pago distinto a Crédito.");
    }

    let idPedido = mov.tipoReferencia === "pedido" ? mov.idReferencia : null;
    if (mov.tipoReferencia === "itemPedido") {
      const item = await trx("itemPedido").where({ idItemPedido: mov.idReferencia }).first();
      idPedido = item?.idPedido ?? null;
    }

    const [pago] = await trx(TABLE).insert({
      valor:                 mov.valor,
      fecha:                 new Date(),
      idTipoMovimiento:      mov.idTipoMovimiento,
      idCategoriaMovimiento: mov.idCategoriaMovimiento,
      idMetodoPago:          idMetodoPagoNuevo,
      tipoReferencia:        "credito",
      idReferencia:          idMovimiento,
      observacion:           mayus(`Pago de crédito${idPedido ? ` del pedido #${idPedido}` : ""}`),
    }).returning("*");
    return pago;
  }).then((pago) => getMovimientoById(pago.idMovimiento));
};

/** Créditos pendientes: método "Crédito" y todavía sin movimiento de pago. */
export const getCreditosPendientes = async () => {
  const movimientos = await RICH_QUERY()
    .whereIn(`${TABLE}.tipoReferencia`, REF_PEDIDOS)
    .whereRaw(ES_METODO_CREDITO)
    .whereRaw(`NOT ${CREDITO_PAGADO}`)
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
  // Un crédito ya pagado no se borra: su pago quedaría apuntando a un
  // movimiento inexistente. Primero se borra el pago (el crédito vuelve a
  // quedar pendiente) y después, si hace falta, el crédito.
  const pago = await db(TABLE).where({ tipoReferencia: "credito", idReferencia: idMovimiento }).first();
  if (pago) {
    throw new Error("Este crédito ya fue pagado -- elimina primero el movimiento de su pago.");
  }
  return db(TABLE).where({ idMovimiento }).del();
};
