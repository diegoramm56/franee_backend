import sql from 'mssql';

// Configuración de la base de datos SQL Server
const dbSettings: sql.config = {
  user: 'AppCosmeticsUser',
  password: 'diegoadmin',
  server: 'mssql-208881-0.cloudclusters.net',
  database: 'CosmeticsPOS',
  port: 10027,
  options: {
    encrypt: true, // true para conexión segura (Azure), false para local por defecto si no hay certificado
    trustServerCertificate: true, // Recomendado en entornos locales
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
