import { getConnection, sql } from '../config/database.js';

export interface CategoryRecord {
  categoryId: string;
  name: string;
  description: string | null;
  state: boolean;
}

const mapCategory = (row: any): CategoryRecord => ({
  categoryId: String(row.id_category),
  name: row.name,
  description: row.description ?? null,
  state: Boolean(row.status)
});

export class CategoriesRepository {
  async findAll(): Promise<CategoryRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_category,
             name,
             description,
             status
      FROM dbo.Categories
      ORDER BY name;
    `);
    return result.recordset.map(mapCategory);
  }

  async findById(categoryId: number): Promise<CategoryRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT id_category,
               name,
               description,
               status
        FROM dbo.Categories
        WHERE id_category = @categoryId;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapCategory(result.recordset[0]);
  }

  async create(data: { name: string; description?: string | null; state?: boolean; }): Promise<CategoryRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('name', sql.NVarChar(120), data.name)
      .input('description', sql.NVarChar(255), data.description ?? null)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Categories ([name], [description], [status])
        OUTPUT inserted.id_category
        VALUES (@name, @description, @state);
      `);
    return (await this.findById(insertResult.recordset[0].id_category))!;
  }

  async update(categoryId: number, data: { name?: string; description?: string | null; state?: boolean; }): Promise<CategoryRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(categoryId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('name', sql.NVarChar(120), data.name ?? existing.name)
      .input('description', sql.NVarChar(255), data.description ?? existing.description)
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('categoryId', sql.Int, categoryId)
      .query(`
        UPDATE dbo.Categories
        SET [name] = @name,
            [description] = @description,
            [status] = @state
        WHERE id_category = @categoryId;
      `);
    return this.findById(categoryId);
  }

  async delete(categoryId: number): Promise<CategoryRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(categoryId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query('DELETE FROM dbo.Categories WHERE id_category = @categoryId;');
    return existing;
  }
}

export const categoriesRepository = new CategoriesRepository();
