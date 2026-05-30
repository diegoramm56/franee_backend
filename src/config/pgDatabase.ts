import pg from 'pg';

const { Pool } = pg;

const PG_DB_NAME = process.env.PG_DATABASE ?? 'cosmetics_pos';

// Pool principal — conecta a la base de datos de réplica
const pgPool = new Pool({
  host: process.env.PG_HOST ?? 'postgresql-212089-0.cloudclusters.net',
  port: Number(process.env.PG_PORT ?? 10018),
  user: process.env.PG_USER ?? 'franee',
  password: process.env.PG_PASSWORD ?? 'Diego5824.',
  database: PG_DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pgPool.on('error', (err) => {
  console.error('[PG Replica] Error inesperado en el pool:', err.message);
});

/**
 * Crea la base de datos `cosmetics_pos` si no existe.
 * Conecta al servidor usando la DB por defecto (`postgres`).
 */
export async function ensurePgDatabaseExists(): Promise<void> {
  const adminPool = new Pool({
    host: process.env.PG_HOST ?? 'postgresql-212089-0.cloudclusters.net',
    port: Number(process.env.PG_PORT ?? 10018),
    user: process.env.PG_USER ?? 'franee',
    password: process.env.PG_PASSWORD ?? 'Diego5824.',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [PG_DB_NAME],
    );
    if (result.rowCount === 0) {
      // No se puede usar parámetros en CREATE DATABASE — el nombre está hardcodeado en la config
      await adminPool.query(`CREATE DATABASE ${PG_DB_NAME}`);
      console.log(`[PG Replica] Base de datos "${PG_DB_NAME}" creada.`);
    } else {
      console.log(`[PG Replica] Base de datos "${PG_DB_NAME}" ya existe.`);
    }
  } finally {
    await adminPool.end();
  }
}

export default pgPool;
