import { Router } from 'express';
//import { register, login } from '../controllers/authController.js';

const router = Router(); // Crear router de Express

router.post('/register', register); // Define las rutas en authController
router.post('/login', login);

export default router; // Exporta desde app