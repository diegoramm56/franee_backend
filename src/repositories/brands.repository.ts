import { getConnection, sql } from '../config/database.js';

export interface BrandRecord {
  brandId: string;
  name: string;
  state: boolean;
}

const mapBrand = (row: any): BrandRecord => ({
  brandId: String(row.id_brand),
  name: row.name,
  state: Boolean(row.status)
});

export class BrandsRepository {
  async findAll(): Promise<BrandRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_brand,
             name,
             status
      FROM dbo.Brands
      ORDER BY name;
    `);
    return result.recordset.map(mapBrand);
  }

  async findById(brandId: number): Promise<BrandRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('brandId', sql.Int, brandId)
      .query(`
        SELECT id_brand,
               name,
               status
        FROM dbo.Brands
        WHERE id_brand = @brandId;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapBrand(result.recordset[0]);
  }

  async create(data: { name: string; state?: boolean; }): Promise<BrandRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('name', sql.NVarChar(120), data.name)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Brands ([name], [status])
        OUTPUT inserted.id_brand
        VALUES (@name, @state);
      `);
    return (await this.findById(insertResult.recordset[0].id_brand))!;
  }

  async update(brandId: number, data: { name?: string; state?: boolean; }): Promise<BrandRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(brandId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('name', sql.NVarChar(120), data.name ?? existing.name)
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('brandId', sql.Int, brandId)
      .query(`
        UPDATE dbo.Brands
        SET [name] = @name,
            [status] = @state
        WHERE id_brand = @brandId;
      `);
    return this.findById(brandId);
  }

  async delete(brandId: number): Promise<BrandRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(brandId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('brandId', sql.Int, brandId)
      .query('DELETE FROM dbo.Brands WHERE id_brand = @brandId;');
    return existing;
  }
}

export const brandsRepository = new BrandsRepository();
