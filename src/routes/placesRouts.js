import { Router } from 'express';
import { RegistrarEnlaGuia, EliminardelaGuia, ObtenerLugaresParalaGuia } from '../controllers/placescontroller.js';

const router = Router();

router.post("/regGuia", RegistrarEnlaGuia);
router.get("/regBorrar", EliminardelaGuia);
router.get("/lugaresGuia", ObtenerLugaresParalaGuia);

export default router;