import { getConnection, sql } from '../config/database.js';

export interface RoleAccessRecord {
  idAccess: number;
  roleId: string;
  moduleName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const mapAccess = (row: any): RoleAccessRecord => ({
  idAccess: row.id_access,
  roleId: String(row.id_role),
  moduleName: row.module_name,
  canView: Boolean(row.can_view),
  canAdd: Boolean(row.can_add),
  canEdit: Boolean(row.can_edit),
  canDelete: Boolean(row.can_delete)
});

export interface ModulePermissionInput {
  moduleName: string;
  canView?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export class RoleAccessRepository {
  async listByRole(roleId: number): Promise<RoleAccessRecord[]> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('roleId', sql.Int, roleId)
      .query(`
        SELECT id_access,
               id_role,
               module_name,
               can_view,
               can_add,
               can_edit,
               can_delete
        FROM dbo.Role_Access
        WHERE id_role = @roleId
        ORDER BY module_name;
      `);
    return result.recordset.map(mapAccess);
  }

  async listModuleNames(roleId: number): Promise<string[]> {
    const access = await this.listByRole(roleId);
    return access.map((item) => item.moduleName);
  }

  async replaceRoleModules(roleId: number, modules: ModulePermissionInput[]): Promise<void> {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction)
        .input('roleId', sql.Int, roleId)
        .query('DELETE FROM dbo.Role_Access WHERE id_role = @roleId;');

      for (const module of modules) {
        await new sql.Request(transaction)
          .input('roleId', sql.Int, roleId)
          .input('moduleName', sql.NVarChar(100), module.moduleName)
          .input('canView', sql.Bit, module.canView ?? true)
          .input('canAdd', sql.Bit, module.canAdd ?? false)
          .input('canEdit', sql.Bit, module.canEdit ?? false)
          .input('canDelete', sql.Bit, module.canDelete ?? false)
          .query(`
            INSERT INTO dbo.Role_Access (id_role, module_name, can_view, can_add, can_edit, can_delete)
            VALUES (@roleId, @moduleName, @canView, @canAdd, @canEdit, @canDelete);
          `);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const roleAccessRepository = new RoleAccessRepository();
