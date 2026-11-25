import { Router } from 'express';
import { register, login, getUsers, getCurrentUser } from '../controllers/authController.js';
import upload from '../config/upload.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

router.post('/register', upload.single('image'), register);
router.post('/login', login);
router.get('/users', getUsers);
router.get('/me', authenticate, getCurrentUser);

export default router;