import { Router } from 'express';
import { CrearTarea, BorrarTarea, CompletarTarea, ObtenerTaeras } from '../controllers/taskController.js';

const router = Router();

router.post("/tareaCrear", CrearTarea);
router.get("/tareaborrar", BorrarTarea);
router.get("/tareaCompletar", CompletarTarea);
router.get("/tareasObtener", ObtenerTaeras);

export default router;