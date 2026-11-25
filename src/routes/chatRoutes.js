import { Router } from 'express';
import { Op } from 'sequelize';
import authenticate from '../middleware/authenticate.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Participant from '../models/Participant.js';
import sequelize from '../config/database.js';

const router = Router();
router.use(authenticate);

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
    const nuevoGrupo = await Chat.create({ tipo: 'grupo', nombre }, { transaction });

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
      attributes: ['id', 'username', 'image'],
      through: { attributes: [] },
    }],
  });

  if (!grupo || !grupo.participants.some(user => user.id === req.userId)) {
    return res.status(404).json({ error: 'Group not found' });
  }

  return res.json(grupo);
});

export default router;