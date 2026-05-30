import cors from 'cors';
import express from 'express';

import { ensurePgDatabaseExists } from './config/pgDatabase.js';
import { initPgSchema } from './replication/pgSchema.js';

import branchesRouter from './routes/branches.routes.js';
import brandsRouter from './routes/brands.routes.js';
import cartRouter from './routes/cart.routes.js';
import categoriesRouter from './routes/categories.routes.js';
import clientsRouter from './routes/clients.routes.js';
import measuresRouter from './routes/measures.routes.js';
import productsRouter from './routes/products.routes.js';
import providersRouter from './routes/providers.routes.js';
import rolesRouter from './routes/roles.routes.js';
import salesRouter, { saleDetailRouter } from './routes/sales.routes.js';
import usersRouter from './routes/users.routes.js';

const app = express();
const port = process.env.PORT ?? 4000;

// CORS: en producción se restringe al dominio de Cloudflare Pages
// Configura CORS_ORIGIN en las variables de entorno de Render, ej:
// CORS_ORIGIN=https://tu-app.pages.dev
// Para múltiples orígenes separa con coma: https://a.pages.dev,https://b.pages.dev
const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir peticiones sin origin (ej. curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} no permitido`));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Backend listo para integrarse con el frontend' });
});

app.use('/Branch', branchesRouter);
app.use('/Brand', brandsRouter);
app.use('/Cart', cartRouter);
app.use('/Category', categoriesRouter);
app.use('/Client', clientsRouter);
app.use('/Measure', measuresRouter);
app.use('/Product', productsRouter);
app.use('/Provider', providersRouter);
app.use('/Rol', rolesRouter);
app.use('/Sale', salesRouter);
app.use('/SaleDetail', saleDetailRouter);
app.use('/User', usersRouter);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);

  // Inicializar la base de datos réplica en PostgreSQL (no bloquea el servidor)
  ensurePgDatabaseExists()
    .then(() => initPgSchema())
    .catch((err: Error) => {
      console.error('[PG Replica] No se pudo inicializar la réplica:', err.message);
    });
});
