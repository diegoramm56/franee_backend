import sql from 'mssql';

// Configuración de la base de datos SQL Server
// Los valores se leen de variables de entorno; si no existen, se usan los valores locales de desarrollo
const dbSettings: sql.config = {
  user: process.env.DB_USER ?? 'AppCosmeticsUser',
  password: process.env.DB_PASSWORD ?? 'diegoadmin',
  server: process.env.DB_SERVER ?? 'mssql-208881-0.cloudclusters.net',
  database: process.env.DB_NAME ?? 'CosmeticsPOS',
  port: Number(process.env.DB_PORT ?? 10027),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export const getConnection = async () => {
  try {
    const pool = await sql.connect(dbSettings);
    console.log('✅ Conexión exitosa a la base de datos SQL Server: CosmeticPOS');
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    throw error;
  }
};

export { sql };
