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
  passwordHash: { //DEBE SER EL MISMO NOMBRE DEL CONTROLLER, Y EL CAMPO DE LA BASE DE DATOS
    type: DataTypes.STRING,
    allowNull: false,
    field: 'pass'
  },
  }, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});