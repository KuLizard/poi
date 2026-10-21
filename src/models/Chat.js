import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('Chat', {
  tipo: {
    type: DataTypes.ENUM('privada', 'grupo'),
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'chats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});