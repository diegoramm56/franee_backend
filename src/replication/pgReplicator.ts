/**
 * PgReplicator — sincroniza cada operación de escritura del SQL Server principal
 * hacia la base de datos PostgreSQL de réplica.
 *
 * Todas las operaciones son "fire & forget": los errores de replicación se
 * registran en consola pero NUNCA propagan al request principal.
 */

import pgPool from '../config/pgDatabase.js';
import type { BranchRecord } from '../repositories/branches.repository.js';
import type { BrandRecord } from '../repositories/brands.repository.js';
import type { CategoryRecord } from '../repositories/categories.repository.js';
import type { MeasureRecord } from '../repositories/measures.repository.js';
import type { ProviderRecord } from '../repositories/providers.repository.js';
import type { ProductRecord } from '../repositories/products.repository.js';
import type { ProductBranchRecord } from '../repositories/productBranch.repository.js';
import type { ClientRecord } from '../repositories/clients.repository.js';
import type { RoleRecord } from '../repositories/roles.repository.js';
import type { RoleAccessRecord, ModulePermissionInput } from '../repositories/roleAccess.repository.js';
import type { UserRecord } from '../repositories/users.repository.js';
import type { SaleRecord } from '../repositories/sales.repository.js';
import type { SaleDetailRecord } from '../repositories/saleDetails.repository.js';

// ─── helper ───────────────────────────────────────────────────────────────────

function fireAndForget(label: string, fn: () => Promise<void>): void {
  fn().catch((err: Error) => {
    console.error(`[PG Replica] Error en "${label}":`, err.message);
  });
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export function replicateUpsertBranch(record: BranchRecord): void {
  fireAndForget('upsert branch', async () => {
    await pgPool.query(
      `INSERT INTO branches (id_branch, name, address, phone, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_branch) DO UPDATE SET
         name    = EXCLUDED.name,
         address = EXCLUDED.address,
         phone   = EXCLUDED.phone,
         status  = EXCLUDED.status`,
      [Number(record.branchId), record.name, record.address, record.phone, record.state],
    );
  });
}

export function replicateDeleteBranch(branchId: number): void {
  fireAndForget('delete branch', async () => {
    await pgPool.query('DELETE FROM branches WHERE id_branch = $1', [branchId]);
  });
}

// ─── Brands ───────────────────────────────────────────────────────────────────

export function replicateUpsertBrand(record: BrandRecord): void {
  fireAndForget('upsert brand', async () => {
    await pgPool.query(
      `INSERT INTO brands (id_brand, name, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_brand) DO UPDATE SET
         name   = EXCLUDED.name,
         status = EXCLUDED.status`,
      [Number(record.brandId), record.name, record.state],
    );
  });
}

export function replicateDeleteBrand(brandId: number): void {
  fireAndForget('delete brand', async () => {
    await pgPool.query('DELETE FROM brands WHERE id_brand = $1', [brandId]);
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function replicateUpsertCategory(record: CategoryRecord): void {
  fireAndForget('upsert category', async () => {
    await pgPool.query(
      `INSERT INTO categories (id_category, name, description, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_category) DO UPDATE SET
         name        = EXCLUDED.name,
         description = EXCLUDED.description,
         status      = EXCLUDED.status`,
      [Number(record.categoryId), record.name, record.description, record.state],
    );
  });
}

export function replicateDeleteCategory(categoryId: number): void {
  fireAndForget('delete category', async () => {
    await pgPool.query('DELETE FROM categories WHERE id_category = $1', [categoryId]);
  });
}

// ─── Measures ─────────────────────────────────────────────────────────────────

export function replicateUpsertMeasure(record: MeasureRecord): void {
  fireAndForget('upsert measure', async () => {
    await pgPool.query(
      `INSERT INTO measures (id_measure, name, abbreviation, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_measure) DO UPDATE SET
         name         = EXCLUDED.name,
         abbreviation = EXCLUDED.abbreviation,
         status       = EXCLUDED.status`,
      [Number(record.measureId), record.name, record.abbreviation, record.state],
    );
  });
}

export function replicateDeleteMeasure(measureId: number): void {
  fireAndForget('delete measure', async () => {
    await pgPool.query('DELETE FROM measures WHERE id_measure = $1', [measureId]);
  });
}

// ─── Providers ────────────────────────────────────────────────────────────────

export function replicateUpsertProvider(record: ProviderRecord): void {
  fireAndForget('upsert provider', async () => {
    await pgPool.query(
      `INSERT INTO providers (id_provider, name, nit, contact, phone, email, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id_provider) DO UPDATE SET
         name    = EXCLUDED.name,
         nit     = EXCLUDED.nit,
         contact = EXCLUDED.contact,
         phone   = EXCLUDED.phone,
         email   = EXCLUDED.email,
         address = EXCLUDED.address,
         status  = EXCLUDED.status`,
      [
        Number(record.providerId), record.name, record.nit,
        record.contact, record.phone, record.email, record.address, record.state,
      ],
    );
  });
}

export function replicateDeleteProvider(providerId: number): void {
  fireAndForget('delete provider', async () => {
    await pgPool.query('DELETE FROM providers WHERE id_provider = $1', [providerId]);
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function replicateUpsertProduct(record: ProductRecord): void {
  fireAndForget('upsert product', async () => {
    await pgPool.query(
      `INSERT INTO products (id_product, barcode, name, description, id_category, id_brand, id_measure, id_provider, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id_product) DO UPDATE SET
         barcode     = EXCLUDED.barcode,
         name        = EXCLUDED.name,
         description = EXCLUDED.description,
         id_category = EXCLUDED.id_category,
         id_brand    = EXCLUDED.id_brand,
         id_measure  = EXCLUDED.id_measure,
         id_provider = EXCLUDED.id_provider,
         status      = EXCLUDED.status`,
      [
        Number(record.productId), record.codeBar, record.name, record.description,
        record.categoryId ? Number(record.categoryId) : null,
        record.brandId ? Number(record.brandId) : null,
        record.measureId ? Number(record.measureId) : null,
        record.providerId ? Number(record.providerId) : null,
        record.state,
      ],
    );
  });
}

export function replicateDeleteProduct(productId: number): void {
  fireAndForget('delete product', async () => {
    await pgPool.query('DELETE FROM products WHERE id_product = $1', [productId]);
  });
}

// ─── Product_Branch ───────────────────────────────────────────────────────────

export function replicateReplaceProductBranches(productId: number, records: ProductBranchRecord[]): void {
  fireAndForget('replace product_branch', async () => {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM product_branch WHERE id_product = $1', [productId]);
      for (const r of records) {
        await client.query(
          `INSERT INTO product_branch (id_product, id_branch, stock, price, cost)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id_product, id_branch) DO UPDATE SET
             stock = EXCLUDED.stock,
             price = EXCLUDED.price,
             cost  = EXCLUDED.cost`,
          [Number(r.productId), Number(r.branchId), r.stock, r.price, r.cost],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });
}

export function replicateDecrementProductBranchStock(productId: number, branchId: number, quantity: number): void {
  fireAndForget('decrement product_branch stock', async () => {
    await pgPool.query(
      `UPDATE product_branch
       SET stock = GREATEST(stock - $3, 0)
       WHERE id_product = $1 AND id_branch = $2`,
      [productId, branchId, quantity],
    );
  });
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export function replicateUpsertClient(record: ClientRecord): void {
  fireAndForget('upsert client', async () => {
    await pgPool.query(
      `INSERT INTO clients (id_client, document_number, name, last_name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id_client) DO UPDATE SET
         document_number = EXCLUDED.document_number,
         name            = EXCLUDED.name,
         last_name       = EXCLUDED.last_name,
         email           = EXCLUDED.email,
         phone           = EXCLUDED.phone,
         address         = EXCLUDED.address`,
      [
        Number(record.clientId), record.documentNumber, record.name,
        record.lastName, record.email, record.phone, record.address,
      ],
    );
  });
}

export function replicateDeleteClient(clientId: number): void {
  fireAndForget('delete client', async () => {
    await pgPool.query('DELETE FROM clients WHERE id_client = $1', [clientId]);
  });
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export function replicateUpsertRole(record: RoleRecord): void {
  fireAndForget('upsert role', async () => {
    await pgPool.query(
      `INSERT INTO roles (id_role, name, description, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_role) DO UPDATE SET
         name        = EXCLUDED.name,
         description = EXCLUDED.description,
         status      = EXCLUDED.status`,
      [Number(record.rolId), record.name, record.description, record.state],
    );
  });
}

export function replicateDeleteRole(roleId: number): void {
  fireAndForget('delete role', async () => {
    await pgPool.query('DELETE FROM roles WHERE id_role = $1', [roleId]);
  });
}

// ─── Role_Access ──────────────────────────────────────────────────────────────

export function replicateReplaceRoleModules(roleId: number, modules: ModulePermissionInput[]): void {
  fireAndForget('replace role_access', async () => {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM role_access WHERE id_role = $1', [roleId]);
      for (const m of modules) {
        await client.query(
          `INSERT INTO role_access (id_role, module_name, can_view, can_add, can_edit, can_delete)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id_role, module_name) DO UPDATE SET
             can_view   = EXCLUDED.can_view,
             can_add    = EXCLUDED.can_add,
             can_edit   = EXCLUDED.can_edit,
             can_delete = EXCLUDED.can_delete`,
          [
            roleId, m.moduleName,
            m.canView ?? true, m.canAdd ?? false, m.canEdit ?? false, m.canDelete ?? false,
          ],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function replicateUpsertUser(record: UserRecord): void {
  fireAndForget('upsert user', async () => {
    await pgPool.query(
      `INSERT INTO users (id_user, username, password, email, name, id_role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id_user) DO UPDATE SET
         username = EXCLUDED.username,
         password = EXCLUDED.password,
         email    = EXCLUDED.email,
         name     = EXCLUDED.name,
         id_role  = EXCLUDED.id_role,
         status   = EXCLUDED.status`,
      [
        Number(record.userId), record.username, record.password,
        record.email, record.name, Number(record.rolId), record.state,
      ],
    );
  });
}

export function replicateDeleteUser(userId: number): void {
  fireAndForget('delete user', async () => {
    await pgPool.query('DELETE FROM users WHERE id_user = $1', [userId]);
  });
}

// ─── User_Branches ────────────────────────────────────────────────────────────

export function replicateReplaceUserBranches(userId: number, branchIds: number[]): void {
  fireAndForget('replace user_branches', async () => {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM user_branches WHERE id_user = $1', [userId]);
      for (const branchId of branchIds) {
        await client.query(
          `INSERT INTO user_branches (id_user, id_branch) VALUES ($1, $2)
           ON CONFLICT (id_user, id_branch) DO NOTHING`,
          [userId, branchId],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export function replicateInsertSale(record: SaleRecord): void {
  fireAndForget('insert sale', async () => {
    await pgPool.query(
      `INSERT INTO sales (id_sale, id_client, id_user, id_branch, sale_date, total_amount, discount_applied, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id_sale) DO NOTHING`,
      [
        Number(record.saleId), Number(record.clientId), Number(record.userId),
        Number(record.branchId), record.saleDate, record.totalAmount,
        record.discountApplied, record.paymentMethod, record.status,
      ],
    );
  });
}

// ─── Sale_Details ─────────────────────────────────────────────────────────────

export function replicateInsertSaleDetail(record: SaleDetailRecord): void {
  fireAndForget('insert sale_detail', async () => {
    await pgPool.query(
      `INSERT INTO sale_details (id_sale, id_product, quantity, unit_price, purchase_price, sale_price, discount, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        Number(record.saleId), Number(record.productId), record.quantity,
        record.unitPrice, record.purchasePrice, record.salePrice,
        record.discount, record.subtotal,
      ],
    );
  });
}
