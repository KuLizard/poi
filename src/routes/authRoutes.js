import { Router } from 'express';
import { register, login, getUsers } from '../controllers/authController.js';
import upload from '../config/upload.js';

const router = Router();

router.post('/register', upload.single('image'), register);
router.post('/login', login);
router.get('/users', getUsers);

export default router;