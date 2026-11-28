import { Server } from 'socket.io';
import { Op } from 'sequelize';
import User from './models/User.js';
import Chat from './models/Chat.js';
import Participant from './models/Participant.js';
import Message from './models/Message.js';
import { verifyToken } from './utils/token.js';
import { attachVideoCalls } from './videoCalls.js';

export function attachChat(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN || 'http://localhost',
        },
        maxHttpBufferSize: 16 * 1024,
    });

    // Usuarios conectados y sus conexiones activas.
    const usuariosConectados = new Map();

    io.use(async (socket, next) => {
        try {
            const session = verifyToken(socket.handshake.auth.token);

            if (!(await User.findByPk(session.userId, { attributes: ['id'] }))) {
                return next(new Error('Invalid or expired token'));
            }

            socket.data.userId = session.userId;
            socket.data.expiresAt = session.expiresAt;

            next();
        } catch {
            next(new Error('Invalid or expired token'));
        }
    });

    attachVideoCalls(io);

    io.on('connection', async (socket) => {
        const userId = socket.data.userId;

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

            // Registrar la conexión del usuario.
            let conexiones = usuariosConectados.get(userId);

            if (!conexiones) {
                conexiones = new Set();
                usuariosConectados.set(userId, conexiones);
            }

            conexiones.add(socket.id);

            // Enviar la lista inicial de usuarios conectados.
            socket.emit('presence:initial', [...usuariosConectados.keys()].map(Number));

            // Notificar que el usuario está conectado.
            io.emit('presence:update', { userId, online: true });

            // Actualizar el estado cuando se desconecta.
            socket.on('disconnect', () => {
                const conexiones = usuariosConectados.get(userId);

                if (!conexiones) return;

                conexiones.delete(socket.id);

                if (conexiones.size === 0) {
                    usuariosConectados.delete(userId);
                    io.emit('presence:update', { userId, online: false });
                }
            });

            // Cargar el historial de una conversación privada.
            socket.on('chat:history', async (payload, ack) => {
                if (typeof ack !== 'function') return;

                const recipientId = Number(payload?.recipientId);

                if (!Number.isSafeInteger(recipientId) || recipientId < 1 || recipientId === userId) {
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
                        recipientId: Number(mensaje.id_user) === userId
                            ? recipientId
                            : userId,
                    }));

                    ack({ messages: resultado });
                } catch (error) {
                    console.error('Error al cargar el historial:', error);
                    ack({ error: 'No se pudo cargar el historial.' });
                }
            });


            // Cargar el historial de un grupo.
            socket.on('group:history', async (payload, ack) => {
                if (typeof ack !== 'function') return;

                const groupId = Number(payload?.groupId);

                if (!Number.isSafeInteger(groupId) || groupId < 1) {
                    return ack({ error: 'Grupo no válido.' });
                }

                try {
                    const grupo = await Chat.findOne({
                        where: { id: groupId, tipo: 'grupo' },
                    });

                    if (!grupo) {
                        return ack({ error: 'Grupo no encontrado.' });
                    }

                    const participante = await Participant.findOne({
                        where: { id_chat: groupId, id_user: userId },
                    });

                    if (!participante) {
                        return ack({ error: 'No perteneces a este grupo.' });
                    }

                    // Unir al usuario a la sala del grupo.
                    await socket.join(`group:${groupId}`);

                    const historial = await Message.findAll({
                        where: { id_chat: groupId },
                        include: [{
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'username', 'image'],
                        }],
                        order: [
                            ['created_at', 'ASC'],
                            ['id', 'ASC'],
                        ],
                    });

                    const resultado = historial.map(mensaje => ({
                        ...mensaje.toJSON(),
                        senderId: Number(mensaje.id_user),
                    }));

                    ack({ messages: resultado });

                } catch (error) {
                    console.error('Error al cargar historial del grupo:', error);
                    ack({ error: 'No se pudo cargar el historial del grupo.' });
                }
            });

            // Enviar mensajes a un grupo.
            socket.on('group:send', async (payload, ack) => {
                if (typeof ack !== 'function') return;

                const groupId = Number(payload?.groupId);
                const content = typeof payload?.body === 'string' ? payload.body.trim() : '';
                const image = typeof payload?.image === 'string' ? payload.image.trim() : '';

                const imagenValida = !image || /^\/uploads\/messages\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(image);

                if (!Number.isSafeInteger(groupId) || groupId < 1 || (!content && !image) || content.length > 2000 || !imagenValida) {
                    return ack({ error: 'Mensaje o imagen no válido.' });
                }

                try {
                    const grupo = await Chat.findOne({
                        where: { id: groupId, tipo: 'grupo' },
                    });

                    if (!grupo) {
                        return ack({ error: 'Grupo no encontrado.' });
                    }

                    const participante = await Participant.findOne({
                        where: { id_chat: groupId, id_user: userId },
                    });

                    if (!participante) {
                        return ack({ error: 'No perteneces a este grupo.' });
                    }

                    const mensajeCreado = await Message.create({
                        id_chat: groupId,
                        id_user: userId,
                        content: content || null,
                        image: image || null,
                    });

                    const mensaje = await Message.findByPk(mensajeCreado.id, {
                        include: [{
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'username', 'image'],
                        }],
                    });

                    const resultado = {
                        ...mensaje.toJSON(),
                        senderId: userId,
                    };

                    io.to(`group:${groupId}`).emit('group:message:new', resultado);

                    ack({ message: resultado });

                } catch (error) {
                    console.error('Unable to save group message:', error);
                    ack({ error: 'No se pudo guardar el mensaje.' });
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
                const content = typeof payload?.body === 'string' ? payload.body.trim() : '';
                const image = typeof payload?.image === 'string' ? payload.image.trim() : '';

                const imagenValida = !image || /^\/uploads\/messages\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(image);

                if (!Number.isSafeInteger(recipientId) || recipientId < 1 || recipientId === userId || (!content && !image) || content.length > 2000 || !imagenValida) {
                    return ack({ error: 'Choose another user and enter a valid message or image.' });
                }

                try {
                    const recipient = await User.findByPk(recipientId, {
                        attributes: ['id'],
                    });

                    if (!recipient) {
                        return ack({ error: 'User not found' });
                    }

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

                    let chat = null;

                    if (sharedChatIds.length > 0) {
                        chat = await Chat.findOne({
                            where: {
                                id: { [Op.in]: sharedChatIds },
                                tipo: 'privada',
                            },
                        });
                    }

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

                    const message = (
                        await Message.create({
                            id_chat: chat.id,
                            id_user: userId,
                            content: content || null,
                            image: image || null,
                        })
                    ).toJSON();

                    const result = {
                        ...message,
                        senderId: userId,
                        recipientId,
                    };

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