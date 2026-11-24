import { Router } from 'express';
import { ObtenerLugaresParalaGuia } from '../controllers/placescontroller.js';

const router = Router();

router.get("/lugaresGuia", ObtenerLugaresParalaGuia);

export default router;