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
    medallas: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const valor = this.getDataValue('medallas');
            if (!valor) return [];
            try { return JSON.parse(valor); } catch { return []; }
        },
        set(lista) {
            this.setDataValue('medallas', JSON.stringify(lista));
        },
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});
