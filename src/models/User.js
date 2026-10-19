import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  pass: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  }, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});