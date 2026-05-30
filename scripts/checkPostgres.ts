import pgPool from '../src/config/pgDatabase.js';

const tables = [
  'branches','roles','brands','categories','measures',
  'providers','clients','users','products',
  'product_branch','sales','sale_details'
];

const results = await Promise.all(
  tables.map(async (t) => {
    const res = await pgPool.query(`SELECT COUNT(*) FROM ${t}`);
    return `  ${t.padEnd(16)}: ${res.rows[0].count} filas`;
  })
);

console.log('\nEstado actual de la réplica PostgreSQL:\n');
console.log(results.join('\n'));
console.log('\n✅ Conexión y datos confirmados.\n');
process.exit(0);
