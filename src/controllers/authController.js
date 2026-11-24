import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export async function register(req, res) {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const pass = req.body?.pass;

  if (!username || username.length > 50) {
    return res.status(400).json({ error: 'Username is required and must not exceed 50 characters' });
  }

  if (!email || email.length > 100 || typeof pass !== 'string' || pass.length < 8 || pass.length > 128) {
    return res.status(400).json({ error: 'A valid email and pass of 8 to 128 characters are required' });
  }

  const image = req.file ? `/uploads/profiles/${req.file.filename}` : null;

  const user = await User.create({ username, email, passwordHash: await hashPassword(pass), image });

  return res.status(201).json({ mensaje: 'Usuario registrado correctamente', token: tokenFor(user), user: { id: user.id, username: user.username, email: user.email, image: user.image } });
}

export async function login(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const pass = req.body?.pass;
  const user = email && typeof pass === 'string' ? await User.findOne({ where: { email } }) : null;

  if (!user || !(await verifyPassword(pass, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or pass' });
  }

  return res.json({ token: tokenFor(user), user: { id: user.id, username: user.username, email: user.email, image: user.image } });
}

export async function getUsers(req, res, next) {
  try {
    const users = await User.findAll({ attributes: ['id', 'username'], order: [['username', 'ASC']] });
    return res.json(users);
  } catch (error) {
    next(error);
  }
}