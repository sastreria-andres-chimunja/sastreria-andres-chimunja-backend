import axios from 'axios';

const META_API = 'https://graph.facebook.com/v20.0';

/**
 * Envía una imagen PNG a un número de WhatsApp usando Meta Cloud API.
 * Requiere WHATSAPP_TOKEN y WHATSAPP_PHONE_ID en el .env.
 *
 * @param {string} telefono     Número colombiano (10 dígitos, sin +57)
 * @param {Buffer} imagenBuffer La imagen como Buffer
 * @param {string} caption      Texto que acompaña la imagen en WhatsApp
 */
export async function enviarImagenWhatsApp(telefono, imagenBuffer, caption) {
  const token   = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error(
      'Falta configuración: agrega WHATSAPP_TOKEN y WHATSAPP_PHONE_ID al archivo .env',
    );
  }

  // Asegurar formato E.164: Colombia = 57 + número sin prefijo
  const digitos = telefono.replace(/\D/g, '');
  const destino = digitos.startsWith('57') ? digitos : `57${digitos}`;

  // ── Paso 1: Subir imagen a Meta Media API ──────────────────────────────
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'image/png');
  form.append('file', new Blob([imagenBuffer], { type: 'image/png' }), 'credenciales.png');

  const uploadResp = await axios.post(
    `${META_API}/${phoneId}/media`,
    form,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const mediaId = uploadResp.data.id;

  // ── Paso 2: Enviar mensaje con la imagen ───────────────────────────────
  const msgResp = await axios.post(
    `${META_API}/${phoneId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: destino,
      type: 'image',
      image: { id: mediaId, caption },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return msgResp.data;
}
