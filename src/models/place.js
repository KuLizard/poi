import { DataTypes, STRING } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('Place', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    }, category: {
        type: DataTypes.STRING,
        allowNull: false
    }, location: {
        type: DataTypes.STRING,
        allowNull: false
    }, service: {
        type: DataTypes.STRING,
        allowNull: false
    },
    }, 
    {
    tableName: 'places',
    timestamps: true,
    createdAt: false,
    updatedAt: false,
});