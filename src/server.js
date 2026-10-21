import app from './app.js';
import sequelize from './config/database.js';
import { createServer } from 'node:http';
import { attachChat } from './chat.js';

import User from './models/User.js';
import Chat from './models/Chat.js';
import Participant from './models/Participant.js';
import Message from './models/Message.js';

// Usuarios y chats
User.belongsToMany(Chat, {
  through: Participant,
  foreignKey: 'id_user',
  otherKey: 'id_chat',
  as: 'chats',
});

Chat.belongsToMany(User, {
  through: Participant,
  foreignKey: 'id_chat',
  otherKey: 'id_user',
  as: 'participants',
});

// Chats y mensajes
Chat.hasMany(Message, {
  foreignKey: 'id_chat',
  as: 'messages',
});

Message.belongsTo(Chat, {
  foreignKey: 'id_chat',
  as: 'chat',
});

// Usuarios y mensajes
User.hasMany(Message, {
  foreignKey: 'id_user',
  as: 'messages',
});

Message.belongsTo(User, {
  foreignKey: 'id_user',
  as: 'sender',
});

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  await sequelize.authenticate();
  await sequelize.sync();

  const port = Number(process.env.PORT) || 3000;
  const server = createServer(app);

  //attachChat(server);
  //server.listen(port, () => console.log(`API listening on http://localhost:${port}`));

  attachChat(server);

  server.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

}

start().catch((error) => {
  console.error('Unable to start API:', error.message);
  process.exitCode = 1;
});