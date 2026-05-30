import { getConnection, sql } from '../config/database.js';
import { replicateUpsertProvider, replicateDeleteProvider } from '../replication/pgReplicator.js';

export interface ProviderRecord {
  providerId: string;
  name: string;
  nit: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  state: boolean;
}

const mapProvider = (row: any): ProviderRecord => ({
  providerId: String(row.id_provider),
  name: row.name,
  nit: row.nit,
  contact: row.contact ?? null,
  phone: row.phone ?? null,
  email: row.email ?? null,
  address: row.address ?? null,
  state: Boolean(row.status)
});

export class ProvidersRepository {
  async findAll(): Promise<ProviderRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_provider,
             name,
             nit,
             contact,
             phone,
             email,
             address,
             status
      FROM dbo.Providers
      ORDER BY name;
    `);
    return result.recordset.map(mapProvider);
  }

  async findById(providerId: number): Promise<ProviderRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('providerId', sql.Int, providerId)
      .query(`
        SELECT id_provider,
               name,
               nit,
               contact,
               phone,
               email,
               address,
               status
        FROM dbo.Providers
        WHERE id_provider = @providerId;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapProvider(result.recordset[0]);
  }

  async create(data: {
    name: string;
    nit: string;
    contact?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    state?: boolean;
  }): Promise<ProviderRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('name', sql.NVarChar(150), data.name)
      .input('nit', sql.NVarChar(30), data.nit)
      .input('contact', sql.NVarChar(150), data.contact ?? null)
      .input('phone', sql.NVarChar(20), data.phone ?? null)
      .input('email', sql.NVarChar(255), data.email ?? null)
      .input('address', sql.NVarChar(255), data.address ?? null)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Providers ([name], nit, contact, phone, email, [address], [status])
        OUTPUT inserted.id_provider
        VALUES (@name, @nit, @contact, @phone, @email, @address, @state);
      `);
    const created = (await this.findById(insertResult.recordset[0].id_provider))!;
    replicateUpsertProvider(created);
    return created;
  }

  async update(providerId: number, data: {
    name?: string;
    nit?: string;
    contact?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    state?: boolean;
  }): Promise<ProviderRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(providerId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('name', sql.NVarChar(150), data.name ?? existing.name)
      .input('nit', sql.NVarChar(30), data.nit ?? existing.nit)
      .input('contact', sql.NVarChar(150), data.contact ?? existing.contact)
      .input('phone', sql.NVarChar(20), data.phone ?? existing.phone)
      .input('email', sql.NVarChar(255), data.email ?? existing.email)
      .input('address', sql.NVarChar(255), data.address ?? existing.address)
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('providerId', sql.Int, providerId)
      .query(`
        UPDATE dbo.Providers
        SET [name] = @name,
            nit = @nit,
            contact = @contact,
            phone = @phone,
            email = @email,
            [address] = @address,
            [status] = @state
        WHERE id_provider = @providerId;
      `);
    const updated = await this.findById(providerId);
    if (updated) replicateUpsertProvider(updated);
    return updated;
  }

  async delete(providerId: number): Promise<ProviderRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(providerId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('providerId', sql.Int, providerId)
      .query('DELETE FROM dbo.Providers WHERE id_provider = @providerId;');
    replicateDeleteProvider(providerId);
    return existing;
  }
}

export const providersRepository = new ProvidersRepository();
