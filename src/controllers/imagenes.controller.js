import * as imagenService from "../services/imagenes.service.js";

export const getImagenes = async (req, res) => {
  try {
    const { tipoReferencia, idReferencia } = req.query;

    const imagenes = await imagenService.getImagenesByReferencia(
      tipoReferencia,
      idReferencia,
    );

    res.json(imagenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadImagen = async (req, res) => {
  try {
    const { tipoReferencia, idReferencia } = req.body;
    const imagenes = [];
    console.log("body:", req.body);
    console.log("files:", req.files);
    for (const file of req.files) {
      const imagen = {
        tipoReferencia,
        idReferencia,
        nombreArchivo: file.filename,
        rutaImagen: file.path,
      };
      const newImagen = await imagenService.createImagen(imagen);
      imagenes.push(newImagen);
    }

    res.status(201).json(imagenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteImagen = async (req, res) => {
  try {
    const { id } = req.params;

    await imagenService.deleteImagen(id);

    res.json({ message: "Imagen eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
