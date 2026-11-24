import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('User', {
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'pass'
    },
    image: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});
