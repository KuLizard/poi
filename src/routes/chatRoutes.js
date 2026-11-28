import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

import { Router } from 'express';
import { Op } from 'sequelize';
import authenticate from '../middleware/authenticate.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Participant from '../models/Participant.js';
import sequelize from '../config/database.js';

const router = Router();
const medalals = ['Explorador', 'Amante', 'Aventurero', 'Santiago', 'Sabores', 'Rey'];
router.use(authenticate);

const carpetaImagenes = path.join(process.cwd(), 'public/uploads/messages');

if (!fs.existsSync(carpetaImagenes)) {
  fs.mkdirSync(carpetaImagenes, { recursive: true });
}

const storageImagenes = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaImagenes),
  filename: (req, file, cb) => {
    const extensiones = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    cb(null, `${randomUUID()}${extensiones[file.mimetype]}`);
  },
});

const uploadImagen = multer({
  storage: storageImagenes,
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (tiposPermitidos.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Obtener usuarios disponibles
router.get('/users', async (req, res) => {
  return res.json(await User.findAll({
    attributes: ['id', 'username', 'image'],
    where: { id: { [Op.ne]: req.userId } },
    order: [['username', 'ASC']],
  }));
});

// Crear grupo
router.post('/groups', async (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  const usuarios = req.body?.usuarios;

  if (!nombre || nombre.length > 100 || !Array.isArray(usuarios)) {
    return res.status(400).json({ error: 'Invalid group name or participants' });
  }

  const ids = [...new Set(usuarios)];

  if (ids.some(id => !Number.isSafeInteger(id) || id < 1 || id === req.userId)) {
    return res.status(400).json({ error: 'Invalid participant IDs' });
  }

  const participantes = [...new Set([req.userId, ...ids])];

  if (participantes.length < 3) {
    return res.status(400).json({ error: 'A group must have at least 3 participants' });
  }

  const encontrados = await User.findAll({
    attributes: ['id'],
    where: { id: { [Op.in]: participantes } },
  });

  if (encontrados.length !== participantes.length) {
    return res.status(404).json({ error: 'One or more users were not found' });
  }

  const grupo = await sequelize.transaction(async transaction => {
    const nuevoGrupo = await Chat.create({ tipo: 'grupo', nombre, usuarioAdmin: req.userId }, { transaction });

    await Participant.bulkCreate(
      participantes.map(id => ({ id_chat: nuevoGrupo.id, id_user: id })),
      { transaction }
    );

    return nuevoGrupo;
  });

  return res.status(201).json({
    mensaje: 'Grupo creado correctamente',
    grupo: {
      id: grupo.id,
      nombre: grupo.nombre,
      tipo: grupo.tipo,
      usuarioAdmin: grupo.usuarioAdmin,
      participantes,
    },
  });
});

// Obtener grupos del usuario
router.get('/groups', async (req, res) => {
  const grupos = await Chat.findAll({
    where: { tipo: 'grupo' },
    include: [{
      model: User,
      as: 'participants',
      attributes: ['id', 'username', 'image'],
      where: { id: req.userId },
      through: { attributes: [] },
    }],
    order: [['created_at', 'DESC']],
  });

  return res.json(grupos);
});

// Obtener información de un grupo
router.get('/groups/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid group ID' });
  }

  const grupo = await Chat.findOne({
    where: { id, tipo: 'grupo' },
    include: [{
      model: User,
      as: 'participants',
      attributes: ['id', 'username', 'image', 'medallas'],
      through: { attributes: [] },
    }],
  });

  if (!grupo || !grupo.participants.some(user => user.id === req.userId)) {
    return res.status(404).json({ error: 'Group not found' });
  }

  return res.json(grupo);
});

// coas de las medallas 
router.get('/medallas', async (req, res) => {
  const usuario = await User.findByPk(req.userId, {attributes:['medallas']});
  return res.json(usuario?.medallas ?? []);
});

router.post('/medallas/:clave', async (req, res) => {

  const {clave } = req.params;
  if (!medalals.includes(clave)) {
    return res.status(400).json({ error: 'Invalid  medal' });
  }

  const usuario = await User.findByPk(req.userId);
  const medallasActualeas = usuario.medallas ?? [];

  if (!medallasActualeas.includes(clave)) {
    usuario.medallas = [...medallasActualeas, clave];
    await usuario.save();
  }

  return res.json(usuario.medallas);
});

// Subir imagen para un mensaje
router.post('/upload-image', (req, res) => {
  uploadImagen.single('image')(req, res, error => {
    if (error) {
      return res.status(400).json({
        error: error.message || 'No se pudo subir la imagen.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Selecciona una imagen.' });
    }

    return res.status(201).json({
      image: `/uploads/messages/${req.file.filename}`,
    });
  });
});

export default router;