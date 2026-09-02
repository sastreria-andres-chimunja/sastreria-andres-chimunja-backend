/**
 * Normaliza texto libre a mayúsculas antes de guardarlo -- a pedido del
 * cliente, todo el texto de la app (nombres, direcciones, descripciones,
 * observaciones...) se guarda en mayúsculas, no solo se muestra así. Se
 * hace acá (backend, al guardar) en vez de en cada input del frontend por
 * separado: un solo lugar por entidad, funciona sin importar desde qué
 * formulario/dispositivo se mande el dato, y no depende de que cada
 * componente nuevo se acuerde de aplicarlo.
 * `null`/`undefined` se devuelven tal cual (para no convertir un campo
 * opcional vacío en la cadena "NULL"/"UNDEFINED").
 */
export const mayus = (texto) => (texto == null ? texto : String(texto).toUpperCase());
