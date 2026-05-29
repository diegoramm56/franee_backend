import { getConnection, sql } from '../config/database.js';

export interface RoleRecord {
  rolId: string;
  name: string;
  description: string | null;
  state: boolean;
  modules: string[];
}

const mapRole = (row: any): RoleRecord => ({
  rolId: String(row.id_role),
  name: row.name,
  description: row.description ?? null,
  state: Boolean(row.status),
  modules: typeof row.modulesCsv === 'string' && row.modulesCsv.length > 0
    ? row.modulesCsv.split(',').map((module: string) => module.trim()).filter(Boolean)
    : []
});

export class RolesRepository {
  async findAll(): Promise<RoleRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT r.id_role,
             r.name,
             r.description,
             r.status,
             STRING_AGG(ra.module_name, ',') WITHIN GROUP (ORDER BY ra.module_name) AS modulesCsv
      FROM dbo.Roles r
      LEFT JOIN dbo.Role_Access ra ON ra.id_role = r.id_role
      GROUP BY r.id_role, r.name, r.description, r.status
      ORDER BY r.name;
    `);
    return result.recordset.map(mapRole);
  }

  async findById(roleId: number): Promise<RoleRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('roleId', sql.Int, roleId)
      .query(`
        SELECT r.id_role,
               r.name,
               r.description,
               r.status,
               STRING_AGG(ra.module_name, ',') WITHIN GROUP (ORDER BY ra.module_name) AS modulesCsv
        FROM dbo.Roles r
        LEFT JOIN dbo.Role_Access ra ON ra.id_role = r.id_role
        WHERE r.id_role = @roleId
        GROUP BY r.id_role, r.name, r.description, r.status;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapRole(result.recordset[0]);
  }

  async create(data: { name: string; description?: string | null; state?: boolean; }): Promise<RoleRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('name', sql.NVarChar(100), data.name)
      .input('description', sql.NVarChar(255), data.description ?? null)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Roles ([name], [description], [status])
        OUTPUT inserted.id_role
        VALUES (@name, @description, @state);
      `);
    const roleId = insertResult.recordset[0].id_role as number;
    const created = await this.findById(roleId);
    if (!created) {
      throw new Error('No se pudo crear el rol');
    }
    return created;
  }

  async update(roleId: number, data: { name?: string; description?: string | null; state?: boolean; }): Promise<RoleRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(roleId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('name', sql.NVarChar(100), data.name ?? existing.name)
      .input('description', sql.NVarChar(255), data.description ?? existing.description)
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('roleId', sql.Int, roleId)
      .query(`
        UPDATE dbo.Roles
        SET [name] = @name,
            [description] = @description,
            [status] = @state
        WHERE id_role = @roleId;
      `);
    return this.findById(roleId);
  }

  async delete(roleId: number): Promise<RoleRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(roleId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('roleId', sql.Int, roleId)
      .query('DELETE FROM dbo.Roles WHERE id_role = @roleId;');
    return existing;
  }
}

export const rolesRepository = new RolesRepository();
