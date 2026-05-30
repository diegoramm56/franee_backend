import { getConnection, sql } from '../config/database.js';
import { replicateUpsertProduct, replicateDeleteProduct } from '../replication/pgReplicator.js';

export interface ProductRecord {
  productId: string;
  codeBar: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  brandId: string | null;
  measureId: string | null;
  providerId: string | null;
  state: boolean;
  purchasePrice: number;
  unitPrice: number;
  gainPercentage: number;
  brand?: { name: string };
  category?: { name: string };
  measure?: { name: string };
  provider?: { name: string };
  stock?: number;
}

const mapProduct = (row: any): ProductRecord => {
  const purchasePrice = Number(row.cost ?? 0);
  const unitPrice = Number(row.price ?? 0);
  const gainPercentage = purchasePrice > 0
    ? Number((((unitPrice - purchasePrice) / purchasePrice) * 100).toFixed(2))
    : 0;
  return {
    productId: String(row.id_product),
    codeBar: row.barcode,
    name: row.name,
    description: row.description ?? null,
    categoryId: row.id_category ? String(row.id_category) : null,
    brandId: row.id_brand ? String(row.id_brand) : null,
    measureId: row.id_measure ? String(row.id_measure) : null,
    providerId: row.id_provider ? String(row.id_provider) : null,
    state: Boolean(row.status),
    purchasePrice,
    unitPrice,
    gainPercentage,
    brand: row.brand_name ? { name: row.brand_name } : undefined,
    category: row.category_name ? { name: row.category_name } : undefined,
    measure: row.measure_name ? { name: row.measure_name } : undefined,
    provider: row.provider_name ? { name: row.provider_name } : undefined,
    stock: row.stock !== undefined && row.stock !== null ? Number(row.stock) : 0
  };
};

const baseSelect = `
  SELECT p.id_product,
         p.barcode,
         p.name,
         p.description,
         p.id_category,
         p.id_brand,
         p.id_measure,
         p.id_provider,
         p.status,
         pb.cost,
         pb.price,
         pb.stock,
         b.name as brand_name,
         c.name as category_name,
         m.name as measure_name,
         pr.name as provider_name
  FROM dbo.Products p
  LEFT JOIN dbo.Brands b ON p.id_brand = b.id_brand
  LEFT JOIN dbo.Categories c ON p.id_category = c.id_category
  LEFT JOIN dbo.Measures m ON p.id_measure = m.id_measure
  LEFT JOIN dbo.Providers pr ON p.id_provider = pr.id_provider
  OUTER APPLY (
    SELECT TOP 1 cost, price, stock
    FROM dbo.Product_Branch pb
    WHERE pb.id_product = p.id_product
    ORDER BY pb.id_branch
  ) pb
`;

const toNullableInt = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export class ProductsRepository {
  async findAll(): Promise<ProductRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`${baseSelect} ORDER BY p.name;`);
    return result.recordset.map(mapProduct);
  }

  async findById(productId: number): Promise<ProductRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`${baseSelect} WHERE p.id_product = @productId;`);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapProduct(result.recordset[0]);
  }

  async findByBranch(branchId: number): Promise<ProductRecord[]> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('branchId', sql.Int, branchId)
      .query(`
        SELECT p.id_product,
               p.barcode,
               p.name,
               p.description,
               p.id_category,
               p.id_brand,
               p.id_measure,
               p.id_provider,
               p.status,
               pb.cost,
               pb.price,
               pb.stock,
               b.name as brand_name,
               c.name as category_name,
               m.name as measure_name,
               pr.name as provider_name
        FROM dbo.Products p
        LEFT JOIN dbo.Brands b ON p.id_brand = b.id_brand
        LEFT JOIN dbo.Categories c ON p.id_category = c.id_category
        LEFT JOIN dbo.Measures m ON p.id_measure = m.id_measure
        LEFT JOIN dbo.Providers pr ON p.id_provider = pr.id_provider
        INNER JOIN dbo.Product_Branch pb ON pb.id_product = p.id_product AND pb.id_branch = @branchId
        WHERE pb.stock > 0
        ORDER BY p.name;
      `);
    return result.recordset.map(mapProduct);
  }

  async create(data: {
    codeBar: string;
    name: string;
    description?: string | null;
    categoryId: number;
    brandId: number;
    measureId: number;
    providerId: number;
    state?: boolean;
  }): Promise<ProductRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('codeBar', sql.NVarChar(50), data.codeBar)
      .input('name', sql.NVarChar(150), data.name)
      .input('description', sql.NVarChar(255), data.description ?? null)
      .input('categoryId', sql.Int, data.categoryId)
      .input('brandId', sql.Int, data.brandId)
      .input('measureId', sql.Int, data.measureId)
      .input('providerId', sql.Int, data.providerId)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Products (barcode, [name], [description], id_category, id_brand, id_measure, id_provider, [status])
        OUTPUT inserted.id_product
        VALUES (@codeBar, @name, @description, @categoryId, @brandId, @measureId, @providerId, @state);
      `);
    const created = (await this.findById(insertResult.recordset[0].id_product))!;
    replicateUpsertProduct(created);
    return created;
  }

  async update(productId: number, data: {
    codeBar?: string;
    name?: string;
    description?: string | null;
    categoryId?: number;
    brandId?: number;
    measureId?: number;
    providerId?: number;
    state?: boolean;
  }): Promise<ProductRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(productId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('codeBar', sql.NVarChar(50), data.codeBar ?? existing.codeBar)
      .input('name', sql.NVarChar(150), data.name ?? existing.name)
      .input('description', sql.NVarChar(255), data.description ?? existing.description)
      .input('categoryId', sql.Int, toNullableInt(data.categoryId ?? existing.categoryId))
      .input('brandId', sql.Int, toNullableInt(data.brandId ?? existing.brandId))
      .input('measureId', sql.Int, toNullableInt(data.measureId ?? existing.measureId))
      .input('providerId', sql.Int, toNullableInt(data.providerId ?? existing.providerId))
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('productId', sql.Int, productId)
      .query(`
        UPDATE dbo.Products
        SET barcode = @codeBar,
            [name] = @name,
            [description] = @description,
            id_category = @categoryId,
            id_brand = @brandId,
            id_measure = @measureId,
            id_provider = @providerId,
            [status] = @state
        WHERE id_product = @productId;
      `);
    const updated = await this.findById(productId);
    if (updated) replicateUpsertProduct(updated);
    return updated;
  }

  async delete(productId: number): Promise<ProductRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(productId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('productId', sql.Int, productId)
      .query('DELETE FROM dbo.Products WHERE id_product = @productId;');
    replicateDeleteProduct(productId);
    return existing;
  }
}

export const productsRepository = new ProductsRepository();
