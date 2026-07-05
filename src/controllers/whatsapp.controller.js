import { enviarImagenWhatsApp, enviarDocumentoWhatsApp } from '../services/whatsapp.service.js';

/**
 * POST /whatsapp/enviar
 * Body: { telefono: string, imagenBase64: string, caption?: string }
 */
export async function enviarCredencial(req, res) {
  const { telefono, imagenBase64, caption } = req.body;

  if (!telefono || !imagenBase64) {
    return res.status(400).json({ error: 'Se requieren telefono e imagenBase64' });
  }

  try {
    const buffer    = Buffer.from(imagenBase64, 'base64');
    const resultado = await enviarImagenWhatsApp(telefono, buffer, caption ?? '');
    res.json({ ok: true, data: resultado });
  } catch (err) {
    const detalle = err.response?.data?.error?.message ?? err.message;
    console.error('[WhatsApp] Error al enviar:', detalle);
    res.status(500).json({ error: 'No se pudo enviar por WhatsApp', detalle });
  }
}

/**
 * POST /whatsapp/enviar-documento
 * Body: { telefono: string, documentoBase64: string, filename?: string, caption?: string }
 */
export async function enviarDocumento(req, res) {
  const { telefono, documentoBase64, filename, caption } = req.body;

  if (!telefono || !documentoBase64) {
    return res.status(400).json({ error: 'Se requieren telefono y documentoBase64' });
  }

  try {
    const buffer    = Buffer.from(documentoBase64, 'base64');
    const resultado = await enviarDocumentoWhatsApp(telefono, buffer, filename || 'documento.pdf', caption ?? '');
    res.json({ ok: true, data: resultado });
  } catch (err) {
    const detalle = err.response?.data?.error?.message ?? err.message;
    console.error('[WhatsApp] Error al enviar documento:', detalle);
    res.status(500).json({ error: 'No se pudo enviar el documento por WhatsApp', detalle });
  }
}
