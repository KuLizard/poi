import express from 'express';

import path from 'node:path';
import { fileURLToPath } from 'node:url'; //estos dos también los agregué para entrar a la página pero ya me dices si está o no b ien 

import cors from 'cors';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import authRoutes from './routes/authRoutes.js';
import lugareRutas from './routes/placesRouts.js';
import tareas from './routes/taskRoutes.js';
//import chatRoutes from './routes/chatRoutes.js';

const app = express();

const archivo = fileURLToPath(import.meta.url);
const direccions = path.dirname(archivo);
app.use(express.static(path.join(direccions, '../public'))); //estos los agregué porque no supe como entrar a la página así que me lo traje de mi otro pia de web

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost' }));
app.use(express.json({ limit: '10kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use(lugareRutas);
app.use(tareas);



//app.use('/api/chat', chatRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((error, req, res, next) => {
  if (error instanceof UniqueConstraintError) return res.status(409).json({ error: 'Email is already registered' });
  if (error instanceof ValidationError) return res.status(400).json({ error: error.errors[0].message });
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'Invalid JSON' });
  if (error.status === 413) return res.status(413).json({ error: 'Request body is too large' });

  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

export default app;