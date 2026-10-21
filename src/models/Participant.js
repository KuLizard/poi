import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Chat from './Chat.js';
import User from './User.js';

export default sequelize.define('Participant', {
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
}, {
  tableName: 'participants',
  timestamps: true,
  createdAt: 'joined_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['id_chat', 'id_user'],
    },
  ],
});