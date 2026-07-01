import { Router } from 'express';
import { enviarCredencial } from '../controllers/whatsapp.controller.js';

const router = Router();

router.post('/enviar', enviarCredencial);

export default router;
