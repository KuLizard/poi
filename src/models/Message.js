import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Chat from './Chat.js';
import User from './User.js';

export default sequelize.define('Message', {
  id_chat: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: Chat, key: 'id' },
  },
  id_user: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true },
  },
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});