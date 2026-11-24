import { DataTypes, STRING } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('Place', {
    nombre: {
        type: DataTypes.STRING
    }, category: {
        type: DataTypes.STRING
    }, location: {
        type: DataTypes.STRING
    }, service: {
        type: DataTypes.STRING
    },
    }, 
    {
    tableName: 'places',
    timestamps: true,
    createdAt: false,
    updatedAt: false,
});