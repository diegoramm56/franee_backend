import { getConnection, sql } from '../config/database.js';

export interface UserBranchRecord {
  userId: string;
  branchId: string;
}

export class UserBranchesRepository {
  async listByUser(userId: number): Promise<UserBranchRecord[]> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT id_user,
               id_branch
        FROM dbo.User_Branches
        WHERE id_user = @userId;
      `);
    return result.recordset.map((row) => ({
      userId: String(row.id_user),
      branchId: String(row.id_branch)
    }));
  }

  async replaceUserBranches(userId: number, branchIds: number[]): Promise<void> {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction)
        .input('userId', sql.Int, userId)
        .query('DELETE FROM dbo.User_Branches WHERE id_user = @userId;');

      for (const branchId of branchIds) {
        await new sql.Request(transaction)
          .input('userId', sql.Int, userId)
          .input('branchId', sql.Int, branchId)
          .query(`
            INSERT INTO dbo.User_Branches (id_user, id_branch)
            VALUES (@userId, @branchId);
          `);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const userBranchesRepository = new UserBranchesRepository();
