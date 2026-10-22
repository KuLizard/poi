import { Router } from 'express';
import { register, login,  getUsers, } from '../controllers/authController.js';

const router = Router(); // Crear router de Express

router.post('/register', register); // Define las rutas en authController
router.post('/login', login);
router.get('/users', getUsers);

export default router; // Exporta desde app


