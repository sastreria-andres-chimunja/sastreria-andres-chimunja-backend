import db from "../config/database.js";

const TABLE = "imagenes";

export const getImagenesByReferencia = async (tipoReferencia, idReferencia) => {
  return db(TABLE).where({ tipoReferencia, idReferencia }).select("*");
};

export const getImagenById = async (id) => {
  return db(TABLE).where({ idImagen: id }).first();
};

export const createImagen = async (imagen) => {
  const [newImagen] = await db(TABLE).insert(imagen).returning("*");

  return newImagen;
};

export const deleteImagen = async (id) => {
  return db(TABLE).where({ idImagen: id }).del();
};
