/*import { Server } from 'socket.io';
import User from './models/User.js';
import Message from './models/Message.js';
import { verifyToken } from './utils/token.js';

export function attachChat(server) {
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' },
    maxHttpBufferSize: 16 * 1024,
  });

  io.use(async (socket, next) => {
    let session;
    try {
      session = verifyToken(socket.handshake.auth.token);
    } catch {
      return next(new Error('Invalid or expired token'));
    }
    try {
      if (!(await User.findByPk(session.userId, { attributes: ['id'] }))) return next(new Error('Invalid or expired token'));
      socket.data = session;
      return next();
    } catch (error) {
      console.error('Unable to authenticate chat account:', error);
      return next(new Error('Chat unavailable. Try again.'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, expiresAt } = socket.data;
    socket.join(`user:${userId}`);
    const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, expiresAt - Date.now()));
    // ponytail: per-socket rate limit; shared per-user limiter if deploying multiple API instances.
    let windowStart = Date.now();
    let count = 0;
    socket.on('disconnect', () => clearTimeout(expiry));
    socket.on('message:send', async (payload, ack) => {
      if (typeof ack !== 'function') return;
      if (Date.now() >= expiresAt) return ack({ error: 'Session expired. Sign in again.' });
      if (Date.now() - windowStart >= 60_000) { windowStart = Date.now(); count = 0; }
      if (++count > 30) return ack({ error: 'Too many messages. Wait a minute.' });
      const recipientId = payload?.recipientId;
      const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
      if (!Number.isSafeInteger(recipientId) || recipientId < 1 || recipientId === userId || !body || body.length > 2000) {
        return ack({ error: 'Choose another user and enter 1 to 2000 characters.' });
      }
      try {
        if (!(await User.findByPk(recipientId, { attributes: ['id'] }))) return ack({ error: 'User not found' });
        const message = (await Message.create({ senderId: userId, recipientId, body })).toJSON();
        io.to([`user:${userId}`, `user:${recipientId}`]).emit('message:new', message);
        ack({ message });
      } catch (error) {
        console.error('Unable to save chat message:', error);
        ack({ error: 'Message could not be saved. Try again.' });
      }
    });
  });
  return io;
}*/


/*import { Server } from 'socket.io';
import User from './models/User.js';
import Message from './models/Message.js';

export function attachChat(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost',
    },
    maxHttpBufferSize: 16 * 1024,
  });

  // Solo para pruebas locales: el frontend indica qué usuario usar.
  io.on('connection', async (socket) => {
    const userId = Number(socket.handshake.auth.userId);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      socket.disconnect(true);
      return;
    }

    try {
      const user = await User.findByPk(userId, {
        attributes: ['id'],
      });

      if (!user) {
        socket.disconnect(true);
        return;
      }

      socket.data.userId = userId;
      socket.join(`user:${userId}`);

      let windowStart = Date.now();
      let count = 0;

      socket.on('message:send', async (payload, ack) => {
        if (typeof ack !== 'function') return;

        if (Date.now() - windowStart >= 60_000) {
          windowStart = Date.now();
          count = 0;
        }

        if (++count > 30) {
          return ack({ error: 'Too many messages. Wait a minute.' });
        }

        const recipientId = payload?.recipientId;
        const body =
          typeof payload?.body === 'string'
            ? payload.body.trim()
            : '';

        if (
          !Number.isSafeInteger(recipientId) ||
          recipientId < 1 ||
          recipientId === userId ||
          !body ||
          body.length > 2000
        ) {
          return ack({
            error: 'Choose another user and enter 1 to 2000 characters.',
          });
        }

        try {
          const recipient = await User.findByPk(recipientId, {
            attributes: ['id'],
          });

          if (!recipient) {
            return ack({ error: 'User not found' });
          }

          const message = (
            await Message.create({
              senderId: userId,
              recipientId,
              body,
            })
          ).toJSON();

          io.to([`user:${userId}`, `user:${recipientId}`])
            .emit('message:new', message);

          ack({ message });
        } catch (error) {
          console.error('Unable to save chat message:', error);
          ack({ error: 'Message could not be saved. Try again.' });
        }
      });
    } catch (error) {
      console.error('Unable to connect chat user:', error);
      socket.disconnect(true);
    }
  });

  return io;
}*/


import { Server } from 'socket.io';
import { Op } from 'sequelize';
import User from './models/User.js';
import Chat from './models/Chat.js';
import Participant from './models/Participant.js';
import Message from './models/Message.js';

export function attachChat(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost',
    },
    maxHttpBufferSize: 16 * 1024,
  });

  io.on('connection', async (socket) => {
    const userId = Number(socket.handshake.auth.userId);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      socket.disconnect(true);
      return;
    }

    try {
      const user = await User.findByPk(userId, {
        attributes: ['id'],
      });

      if (!user) {
        socket.disconnect(true);
        return;
      }

      socket.data.userId = userId;
      socket.join(`user:${userId}`);

      
      // Cargar el historial de una conversación privada.
      socket.on('chat:history', async (payload, ack) => {
        if (typeof ack !== 'function') return;

        const recipientId = Number(payload?.recipientId);

        if (
          !Number.isSafeInteger(recipientId) ||
          recipientId < 1 ||
          recipientId === userId
        ) {
          return ack({ error: 'Contacto no válido.' });
        }

        try {
          const recipient = await User.findByPk(recipientId, {
            attributes: ['id'],
          });

          if (!recipient) {
            return ack({ error: 'Usuario no encontrado.' });
          }

          // Buscar los chats compartidos por ambos usuarios.
          const [chatsUsuario, chatsContacto] = await Promise.all([
            Participant.findAll({
              where: { id_user: userId },
              attributes: ['id_chat'],
            }),
            Participant.findAll({
              where: { id_user: recipientId },
              attributes: ['id_chat'],
            }),
          ]);

          const idsContacto = new Set(
            chatsContacto.map((p) => Number(p.id_chat))
          );

          const idsCompartidos = chatsUsuario
            .map((p) => Number(p.id_chat))
            .filter((id) => idsContacto.has(id));

          if (idsCompartidos.length === 0) {
            return ack({ messages: [] });
          }

          const chat = await Chat.findOne({
            where: {
              id: { [Op.in]: idsCompartidos },
              tipo: 'privada',
            },
          });

          if (!chat) {
            return ack({ messages: [] });
          }

          const historial = await Message.findAll({
            where: { id_chat: chat.id },
            order: [
              ['created_at', 'ASC'],
              ['id', 'ASC'],
            ],
          });

          const resultado = historial.map((mensaje) => ({
            ...mensaje.toJSON(),
            senderId: Number(mensaje.id_user),
            recipientId:
              Number(mensaje.id_user) === userId
                ? recipientId
                : userId,
          }));

          ack({ messages: resultado });
        } catch (error) {
          console.error('Error al cargar el historial:', error);
          ack({ error: 'No se pudo cargar el historial.' });
        }
      });


      let windowStart = Date.now();
      let count = 0;

      socket.on('message:send', async (payload, ack) => {
        if (typeof ack !== 'function') return;

        if (Date.now() - windowStart >= 60_000) {
          windowStart = Date.now();
          count = 0;
        }

        if (++count > 30) {
          return ack({ error: 'Too many messages. Wait a minute.' });
        }

        const recipientId = payload?.recipientId;
        const content =
          typeof payload?.body === 'string'
            ? payload.body.trim()
            : '';

        if (
          !Number.isSafeInteger(recipientId) ||
          recipientId < 1 ||
          recipientId === userId ||
          !content ||
          content.length > 2000
        ) {
          return ack({
            error: 'Choose another user and enter 1 to 2000 characters.',
          });
        }

        try {
          const recipient = await User.findByPk(recipientId, {
            attributes: ['id'],
          });

          if (!recipient) {
            return ack({ error: 'User not found' });
          }

          // Buscar chats en los que participa cada usuario.
          const [userChats, recipientChats] = await Promise.all([
            Participant.findAll({
              where: { id_user: userId },
              attributes: ['id_chat'],
            }),
            Participant.findAll({
              where: { id_user: recipientId },
              attributes: ['id_chat'],
            }),
          ]);

          const recipientChatIds = new Set(
            recipientChats.map((participant) => participant.id_chat)
          );

          const sharedChatIds = userChats
            .map((participant) => participant.id_chat)
            .filter((id) => recipientChatIds.has(id));

          // Encontrar la conversación privada compartida.
          let chat = null;

          if (sharedChatIds.length > 0) {
            chat = await Chat.findOne({
              where: {
                id: { [Op.in]: sharedChatIds },
                tipo: 'privada',
              },
            });
          }

          // Si no existe, crear la conversación y sus participantes.
          if (!chat) {
            chat = await Chat.create({
              tipo: 'privada',
              nombre: null,
            });

            await Participant.bulkCreate([
              { id_chat: chat.id, id_user: userId },
              { id_chat: chat.id, id_user: recipientId },
            ]);
          }

          // Guardar usando las columnas reales de messages.
          const message = (
            await Message.create({
              id_chat: chat.id,
              id_user: userId,
              content,
            })
          ).toJSON();

          const result = {
            ...message,
            senderId: userId,
            recipientId,
          };

          // Entregar el mensaje a ambos usuarios en tiempo real.
          io.to([`user:${userId}`, `user:${recipientId}`])
            .emit('message:new', result);

          ack({ message: result });
        } catch (error) {
          console.error('Unable to save chat message:', error);
          ack({ error: 'Message could not be saved. Try again.' });
        }
      });
    } catch (error) {
      console.error('Unable to connect chat user:', error);
      socket.disconnect(true);
    }
  });

  return io;
}
