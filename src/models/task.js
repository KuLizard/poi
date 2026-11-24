import { DataTypes, STRING } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('Task', {
    content: {
        type: DataTypes.STRING,
        allowNull: false
    }, user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }, chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }, estado: {
        type: DataTypes.ENUM("pendiente", "completada"),
        allowNull: false
    },
    }, 
    {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});