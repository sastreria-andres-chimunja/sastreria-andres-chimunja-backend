import { Router } from 'express';
import { enviarCredencial, enviarDocumento } from '../controllers/whatsapp.controller.js';

const router = Router();

router.post('/enviar', enviarCredencial);
router.post('/enviar-documento', enviarDocumento);

export default router;
