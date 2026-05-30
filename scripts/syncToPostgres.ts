/**
 * syncToPostgres.ts
 * Copia TODO el contenido actual del SQL Server (CosmeticsPOS) a la réplica PostgreSQL.
 * Ejecutar UNA sola vez para la sincronización inicial (o cuando se quiera resincronizar).
 *
 * Uso:
 *   npx tsx scripts/syncToPostgres.ts
 */

import { getConnection, sql } from '../src/config/database.js';
import pgPool, { ensurePgDatabaseExists } from '../src/config/pgDatabase.js';
import { initPgSchema } from '../src/replication/pgSchema.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

let step = 0;
function log(msg: string) {
  step++;
  console.log(`[${step}] ${msg}`);
}
function ok(entity: string, count: number) {
  console.log(`    ✅ ${entity}: ${count} filas copiadas`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔄 Sincronización SQL Server → PostgreSQL\n');

  // 1. Asegurar que la DB y el esquema existen
  log('Verificando base de datos PostgreSQL...');
  await ensurePgDatabaseExists();
  await initPgSchema();

  const mssql = await getConnection();
  const pg = pgPool;

  // ── LIMPIAR TABLAS CON FK (orden inverso) ──────────────────────────────────
  log('Limpiando tablas anteriores en PostgreSQL...');
  await pg.query(`
    TRUNCATE TABLE sale_details, sales, product_branch, user_branches,
                   role_access, products, clients, users, providers,
                   measures, categories, brands, roles, branches
    RESTART IDENTITY CASCADE;
  `);
  console.log('    ✅ Tablas vaciadas');

  // ── BRANCHES ───────────────────────────────────────────────────────────────
  log('Copiando sucursales...');
  const branches = await mssql.request().query(`
    SELECT id_branch, name, address, phone, status FROM dbo.Branches;
  `);
  for (const r of branches.recordset) {
    await pg.query(
      `INSERT INTO branches (id_branch, name, address, phone, status)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id_branch) DO UPDATE SET
         name=$2, address=$3, phone=$4, status=$5`,
      [r.id_branch, r.name, r.address ?? null, r.phone ?? null, Boolean(r.status)],
    );
  }
  ok('Sucursales', branches.recordset.length);

  // ── ROLES ──────────────────────────────────────────────────────────────────
  log('Copiando roles...');
  const roles = await mssql.request().query(`
    SELECT id_role, name, description, status FROM dbo.Roles;
  `);
  for (const r of roles.recordset) {
    await pg.query(
      `INSERT INTO roles (id_role, name, description, status)
       VALUES ($1,$2,$3,$4) ON CONFLICT (id_role) DO UPDATE SET
         name=$2, description=$3, status=$4`,
      [r.id_role, r.name, r.description ?? null, Boolean(r.status)],
    );
  }
  ok('Roles', roles.recordset.length);

  // ── ROLE_ACCESS ────────────────────────────────────────────────────────────
  log('Copiando accesos de roles...');
  const roleAccess = await mssql.request().query(`
    SELECT id_role, module_name,
           ISNULL(can_view,1)   AS can_view,
           ISNULL(can_add,0)    AS can_add,
           ISNULL(can_edit,0)   AS can_edit,
           ISNULL(can_delete,0) AS can_delete
    FROM dbo.Role_Access;
  `);
  for (const r of roleAccess.recordset) {
    await pg.query(
      `INSERT INTO role_access (id_role, module_name, can_view, can_add, can_edit, can_delete)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id_role, module_name) DO UPDATE SET
         can_view=$3, can_add=$4, can_edit=$5, can_delete=$6`,
      [r.id_role, r.module_name, Boolean(r.can_view), Boolean(r.can_add), Boolean(r.can_edit), Boolean(r.can_delete)],
    );
  }
  ok('Role_Access', roleAccess.recordset.length);

  // ── BRANDS ─────────────────────────────────────────────────────────────────
  log('Copiando marcas...');
  const brands = await mssql.request().query(`
    SELECT id_brand, name, status FROM dbo.Brands;
  `);
  for (const r of brands.recordset) {
    await pg.query(
      `INSERT INTO brands (id_brand, name, status)
       VALUES ($1,$2,$3) ON CONFLICT (id_brand) DO UPDATE SET name=$2, status=$3`,
      [r.id_brand, r.name, Boolean(r.status)],
    );
  }
  ok('Marcas', brands.recordset.length);

  // ── CATEGORIES ─────────────────────────────────────────────────────────────
  log('Copiando categorías...');
  const categories = await mssql.request().query(`
    SELECT id_category, name, description, status FROM dbo.Categories;
  `);
  for (const r of categories.recordset) {
    await pg.query(
      `INSERT INTO categories (id_category, name, description, status)
       VALUES ($1,$2,$3,$4) ON CONFLICT (id_category) DO UPDATE SET
         name=$2, description=$3, status=$4`,
      [r.id_category, r.name, r.description ?? null, Boolean(r.status)],
    );
  }
  ok('Categorías', categories.recordset.length);

  // ── MEASURES ───────────────────────────────────────────────────────────────
  log('Copiando medidas...');
  const measures = await mssql.request().query(`
    SELECT id_measure, name, abbreviation, status FROM dbo.Measures;
  `);
  for (const r of measures.recordset) {
    await pg.query(
      `INSERT INTO measures (id_measure, name, abbreviation, status)
       VALUES ($1,$2,$3,$4) ON CONFLICT (id_measure) DO UPDATE SET
         name=$2, abbreviation=$3, status=$4`,
      [r.id_measure, r.name, r.abbreviation, Boolean(r.status)],
    );
  }
  ok('Medidas', measures.recordset.length);

  // ── PROVIDERS ──────────────────────────────────────────────────────────────
  log('Copiando proveedores...');
  const providers = await mssql.request().query(`
    SELECT id_provider, name, nit, contact, phone, email, address, status FROM dbo.Providers;
  `);
  for (const r of providers.recordset) {
    await pg.query(
      `INSERT INTO providers (id_provider, name, nit, contact, phone, email, address, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id_provider) DO UPDATE SET
         name=$2, nit=$3, contact=$4, phone=$5, email=$6, address=$7, status=$8`,
      [r.id_provider, r.name, r.nit ?? null, r.contact ?? null,
       r.phone ?? null, r.email ?? null, r.address ?? null, Boolean(r.status)],
    );
  }
  ok('Proveedores', providers.recordset.length);

  // ── CLIENTS ────────────────────────────────────────────────────────────────
  log('Copiando clientes...');
  const clients = await mssql.request().query(`
    SELECT id_client, document_number, name, last_name, email, phone, address FROM dbo.Clients;
  `);
  for (const r of clients.recordset) {
    await pg.query(
      `INSERT INTO clients (id_client, document_number, name, last_name, email, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id_client) DO UPDATE SET
         document_number=$2, name=$3, last_name=$4, email=$5, phone=$6, address=$7`,
      [r.id_client, r.document_number ?? null, r.name, r.last_name ?? null,
       r.email ?? null, r.phone ?? null, r.address ?? null],
    );
  }
  ok('Clientes', clients.recordset.length);

  // ── USERS ──────────────────────────────────────────────────────────────────
  log('Copiando usuarios...');
  const users = await mssql.request().query(`
    SELECT id_user, username, password, email, name, id_role, status FROM dbo.Users;
  `);
  for (const r of users.recordset) {
    await pg.query(
      `INSERT INTO users (id_user, username, password, email, name, id_role, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id_user) DO UPDATE SET
         username=$2, password=$3, email=$4, name=$5, id_role=$6, status=$7`,
      [r.id_user, r.username, r.password, r.email ?? null,
       r.name, r.id_role ?? null, Boolean(r.status)],
    );
  }
  ok('Usuarios', users.recordset.length);

  // ── USER_BRANCHES ──────────────────────────────────────────────────────────
  log('Copiando asignaciones usuario-sucursal...');
  const userBranches = await mssql.request().query(`
    SELECT id_user, id_branch FROM dbo.User_Branches;
  `);
  for (const r of userBranches.recordset) {
    await pg.query(
      `INSERT INTO user_branches (id_user, id_branch)
       VALUES ($1,$2) ON CONFLICT (id_user, id_branch) DO NOTHING`,
      [r.id_user, r.id_branch],
    );
  }
  ok('User_Branches', userBranches.recordset.length);

  // ── PRODUCTS ───────────────────────────────────────────────────────────────
  log('Copiando productos...');
  const products = await mssql.request().query(`
    SELECT id_product, barcode, name, description,
           id_category, id_brand, id_measure, id_provider, status
    FROM dbo.Products;
  `);
  for (const r of products.recordset) {
    await pg.query(
      `INSERT INTO products (id_product, barcode, name, description, id_category, id_brand, id_measure, id_provider, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id_product) DO UPDATE SET
         barcode=$2, name=$3, description=$4, id_category=$5,
         id_brand=$6, id_measure=$7, id_provider=$8, status=$9`,
      [r.id_product, r.barcode, r.name, r.description ?? null,
       r.id_category ?? null, r.id_brand ?? null,
       r.id_measure ?? null, r.id_provider ?? null, Boolean(r.status)],
    );
  }
  ok('Productos', products.recordset.length);

  // ── PRODUCT_BRANCH ─────────────────────────────────────────────────────────
  log('Copiando stock por sucursal...');
  const productBranch = await mssql.request().query(`
    SELECT id_product, id_branch, stock, price, cost FROM dbo.Product_Branch;
  `);
  for (const r of productBranch.recordset) {
    await pg.query(
      `INSERT INTO product_branch (id_product, id_branch, stock, price, cost)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id_product, id_branch) DO UPDATE SET
         stock=$3, price=$4, cost=$5`,
      [r.id_product, r.id_branch, Number(r.stock ?? 0),
       Number(r.price ?? 0), Number(r.cost ?? 0)],
    );
  }
  ok('Product_Branch', productBranch.recordset.length);

  // ── SALES ──────────────────────────────────────────────────────────────────
  log('Copiando ventas...');
  const sales = await mssql.request().query(`
    SELECT id_sale, id_client, id_user, id_branch,
           sale_date, total_amount, discount_applied,
           payment_method, status
    FROM dbo.Sales;
  `);
  for (const r of sales.recordset) {
    await pg.query(
      `INSERT INTO sales (id_sale, id_client, id_user, id_branch, sale_date, total_amount, discount_applied, payment_method, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id_sale) DO NOTHING`,
      [r.id_sale, r.id_client ?? null, r.id_user ?? null, r.id_branch ?? null,
       r.sale_date, Number(r.total_amount ?? 0),
       Number(r.discount_applied ?? 0), r.payment_method, r.status],
    );
  }
  ok('Ventas', sales.recordset.length);

  // ── SALE_DETAILS ───────────────────────────────────────────────────────────
  log('Copiando detalles de ventas...');
  const saleDetails = await mssql.request().query(`
    SELECT id_sale, id_product, quantity, unit_price, subtotal
    FROM dbo.Sale_Details;
  `);
  for (const r of saleDetails.recordset) {
    await pg.query(
      `INSERT INTO sale_details (id_sale, id_product, quantity, unit_price, subtotal)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.id_sale, r.id_product ?? null,
       Number(r.quantity), Number(r.unit_price), Number(r.subtotal ?? 0)],
    );
  }
  ok('Sale_Details', saleDetails.recordset.length);

  // ── RESUMEN ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Sincronización completada exitosamente.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Error durante la sincronización:', err.message ?? err);
  process.exit(1);
});
