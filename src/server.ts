import cors from 'cors';
import express from 'express';

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

app.use(cors());
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
});
