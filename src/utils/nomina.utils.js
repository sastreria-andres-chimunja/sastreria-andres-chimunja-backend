/**
 * Lo que gana el empleado por un ítem: el valor fijo de comisión si el ítem
 * lo tiene (confecciones), o valor × % de comisión (arreglos y el resto).
 */
export const valorEmpleadoItem = (item) =>
  item.valorComision != null
    ? Number(item.valorComision)
    : Number(item.valor ?? 0) * Number(item.comisionEmpleado ?? 0) / 100;

/** Misma regla en SQL, para sumas en la base (alias del ítem: `ip`). */
export const VALOR_EMPLEADO_SQL = (alias = "ip") =>
  `COALESCE(${alias}."valorComision", ${alias}.valor * ${alias}."comisionEmpleado" / 100.0)`;

/** "(50%)" o "(comisión fija)" para la observación del pago de nómina. */
export const etiquetaComision = (item) =>
  item.valorComision != null ? "(comisión fija)" : `(${item.comisionEmpleado ?? 0}%)`;
