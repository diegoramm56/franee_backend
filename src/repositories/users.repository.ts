import { getConnection, sql } from '../config/database.js';

export interface UserRecord {
  userId: string;
  username: string;
  name: string;
  password: string;
  rolId: string;
  email: string | null;
  state: boolean;
  branchAccess: string[];
}

const mapUser = (row: any): UserRecord => ({
  userId: String(row.id_user),
  username: row.username,
  name: row.name,
  password: row.password,
  rolId: String(row.id_role),
  email: row.email ?? null,
  state: Boolean(row.status),
  branchAccess: typeof row.branch_ids === 'string' && row.branch_ids.length > 0
    ? row.branch_ids.split(',').map((id: string) => id.trim()).filter(Boolean)
    : []
});

export class UsersRepository {
  async findAll(): Promise<UserRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT u.id_user,
             u.username,
             u.password,
             u.email,
             u.name,
             u.id_role,
             u.status,
             STRING_AGG(CAST(ub.id_branch AS NVARCHAR(10)), ',') WITHIN GROUP (ORDER BY ub.id_branch) AS branch_ids
      FROM dbo.Users u
      LEFT JOIN dbo.User_Branches ub ON ub.id_user = u.id_user
      GROUP BY u.id_user, u.username, u.password, u.email, u.name, u.id_role, u.status
      ORDER BY u.name;
    `);
    return result.recordset.map(mapUser);
  }

  async findById(userId: number): Promise<UserRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.id_user,
               u.username,
               u.password,
               u.email,
               u.name,
               u.id_role,
               u.status,
               STRING_AGG(CAST(ub.id_branch AS NVARCHAR(10)), ',') WITHIN GROUP (ORDER BY ub.id_branch) AS branch_ids
        FROM dbo.Users u
        LEFT JOIN dbo.User_Branches ub ON ub.id_user = u.id_user
        WHERE u.id_user = @userId
        GROUP BY u.id_user, u.username, u.password, u.email, u.name, u.id_role, u.status;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapUser(result.recordset[0]);
  }

  async findByCredentials(username: string, password: string): Promise<UserRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('password', sql.NVarChar(255), password)
      .query(`
        SELECT u.id_user,
               u.username,
               u.password,
               u.email,
               u.name,
               u.id_role,
               u.status,
               STRING_AGG(CAST(ub.id_branch AS NVARCHAR(10)), ',') WITHIN GROUP (ORDER BY ub.id_branch) AS branch_ids
        FROM dbo.Users u
        LEFT JOIN dbo.User_Branches ub ON ub.id_user = u.id_user
        WHERE u.username = @username AND u.password = @password
        GROUP BY u.id_user, u.username, u.password, u.email, u.name, u.id_role, u.status;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapUser(result.recordset[0]);
  }

  async create(data: { username: string; name: string; password: string; rolId: number; email?: string | null; state?: boolean; }): Promise<UserRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('username', sql.NVarChar(50), data.username)
      .input('password', sql.NVarChar(255), data.password)
      .input('email', sql.NVarChar(255), data.email ?? null)
      .input('name', sql.NVarChar(150), data.name)
      .input('rolId', sql.Int, data.rolId)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Users (username, [password], email, [name], id_role, [status])
        OUTPUT inserted.id_user
        VALUES (@username, @password, @email, @name, @rolId, @state);
      `);
    return (await this.findById(insertResult.recordset[0].id_user))!;
  }

  async update(userId: number, data: { username?: string; name?: string; password?: string; rolId?: number; email?: string | null; state?: boolean; }): Promise<UserRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(userId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('username', sql.NVarChar(50), data.username ?? existing.username)
      .input('password', sql.NVarChar(255), data.password ?? existing.password)
      .input('email', sql.NVarChar(255), data.email ?? existing.email)
      .input('name', sql.NVarChar(150), data.name ?? existing.name)
      .input('rolId', sql.Int, data.rolId ?? Number(existing.rolId))
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE dbo.Users
        SET username = @username,
            [password] = @password,
            email = @email,
            [name] = @name,
            id_role = @rolId,
            [status] = @state
        WHERE id_user = @userId;
      `);
    return this.findById(userId);
  }

  async delete(userId: number): Promise<UserRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(userId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM dbo.Users WHERE id_user = @userId;');
    return existing;
  }
}

export const usersRepository = new UsersRepository();
