import { getConnection, sql } from '../config/database.js';

export interface BranchRecord {
  branchId: string;
  name: string;
  address: string | null;
  phone: string | null;
  state: boolean;
}

const mapBranch = (row: any): BranchRecord => ({
  branchId: String(row.id_branch),
  name: row.name,
  address: row.address ?? null,
  phone: row.phone ?? null,
  state: Boolean(row.status)
});

export class BranchesRepository {
  async findAll(): Promise<BranchRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_branch,
             name,
             address,
             phone,
             status
      FROM dbo.Branches
      ORDER BY name;
    `);
    return result.recordset.map(mapBranch);
  }

  async findById(branchId: number): Promise<BranchRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('branchId', sql.Int, branchId)
      .query(`
        SELECT id_branch,
               name,
               address,
               phone,
               status
        FROM dbo.Branches
        WHERE id_branch = @branchId;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapBranch(result.recordset[0]);
  }

  async create(data: { name: string; address?: string | null; phone?: string | null; state?: boolean; }): Promise<BranchRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('name', sql.NVarChar(150), data.name)
      .input('address', sql.NVarChar(255), data.address ?? null)
      .input('phone', sql.NVarChar(20), data.phone ?? null)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Branches ([name], [address], [phone], [status])
        OUTPUT inserted.id_branch
        VALUES (@name, @address, @phone, @state);
      `);
    return (await this.findById(insertResult.recordset[0].id_branch))!;
  }

  async update(branchId: number, data: { name?: string; address?: string | null; phone?: string | null; state?: boolean; }): Promise<BranchRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(branchId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('name', sql.NVarChar(150), data.name ?? existing.name)
      .input('address', sql.NVarChar(255), data.address ?? existing.address)
      .input('phone', sql.NVarChar(20), data.phone ?? existing.phone)
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('branchId', sql.Int, branchId)
      .query(`
        UPDATE dbo.Branches
        SET [name] = @name,
            [address] = @address,
            [phone] = @phone,
            [status] = @state
        WHERE id_branch = @branchId;
      `);
    return this.findById(branchId);
  }

  async delete(branchId: number): Promise<BranchRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(branchId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('branchId', sql.Int, branchId)
      .query('DELETE FROM dbo.Branches WHERE id_branch = @branchId;');
    return existing;
  }
}

export const branchesRepository = new BranchesRepository();
