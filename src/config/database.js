import { Sequelize } from 'sequelize';

export default new Sequelize(
  process.env.DB_NAME || 'proyectopoi',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Sakurai369',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  },
);