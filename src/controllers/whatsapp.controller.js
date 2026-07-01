import { enviarImagenWhatsApp } from '../services/whatsapp.service.js';

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
