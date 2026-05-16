import { getConnection, sql } from '../config/database.js';

export interface ClientRecord {
  clientId: string;
  documentNumber: string | null;
  name: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

const mapClient = (row: any): ClientRecord => ({
  clientId: String(row.id_client),
  documentNumber: row.document_number ?? null,
  name: row.name,
  lastName: row.last_name ?? null,
  email: row.email ?? null,
  phone: row.phone ?? null,
  address: row.address ?? null
});

export class ClientsRepository {
  async findAll(): Promise<ClientRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_client,
             document_number,
             [name],
             last_name,
             email,
             phone,
             [address]
      FROM dbo.Clients
      ORDER BY name;
    `);
    return result.recordset.map(mapClient);
  }

  async findById(clientId: number): Promise<ClientRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('clientId', sql.Int, clientId)
      .query(`
        SELECT id_client,
               document_number,
               [name],
               last_name,
               email,
               phone,
               [address]
        FROM dbo.Clients
        WHERE id_client = @clientId;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapClient(result.recordset[0]);
  }

  async create(data: {
    documentNumber?: string | null;
    name: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }): Promise<ClientRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('documentNumber', sql.NVarChar(30), data.documentNumber ?? null)
      .input('name', sql.NVarChar(100), data.name)
      .input('lastName', sql.NVarChar(100), data.lastName ?? null)
      .input('email', sql.NVarChar(255), data.email ?? null)
      .input('phone', sql.NVarChar(20), data.phone ?? null)
      .input('address', sql.NVarChar(255), data.address ?? null)
      .query(`
        INSERT INTO dbo.Clients (document_number, [name], last_name, email, phone, [address])
        OUTPUT inserted.id_client
        VALUES (@documentNumber, @name, @lastName, @email, @phone, @address);
      `);
    return (await this.findById(insertResult.recordset[0].id_client))!;
  }

  async update(clientId: number, data: {
    documentNumber?: string | null;
    name?: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }): Promise<ClientRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(clientId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('documentNumber', sql.NVarChar(30), data.documentNumber ?? existing.documentNumber)
      .input('name', sql.NVarChar(100), data.name ?? existing.name)
      .input('lastName', sql.NVarChar(100), data.lastName ?? existing.lastName)
      .input('email', sql.NVarChar(255), data.email ?? existing.email)
      .input('phone', sql.NVarChar(20), data.phone ?? existing.phone)
      .input('address', sql.NVarChar(255), data.address ?? existing.address)
      .input('clientId', sql.Int, clientId)
      .query(`
        UPDATE dbo.Clients
        SET document_number = @documentNumber,
            [name] = @name,
            last_name = @lastName,
            email = @email,
            phone = @phone,
            [address] = @address
        WHERE id_client = @clientId;
      `);
    return this.findById(clientId);
  }

  async delete(clientId: number): Promise<ClientRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(clientId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('clientId', sql.Int, clientId)
      .query('DELETE FROM dbo.Clients WHERE id_client = @clientId;');
    return existing;
  }
}

export const clientsRepository = new ClientsRepository();
