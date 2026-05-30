import { getConnection, sql } from '../config/database.js';
import { replicateUpsertMeasure, replicateDeleteMeasure } from '../replication/pgReplicator.js';

export interface MeasureRecord {
  measureId: string;
  name: string;
  abbreviation: string;
  state: boolean;
}

const mapMeasure = (row: any): MeasureRecord => ({
  measureId: String(row.id_measure),
  name: row.name,
  abbreviation: row.abbreviation,
  state: Boolean(row.status)
});

export class MeasuresRepository {
  async findAll(): Promise<MeasureRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_measure,
             name,
             abbreviation,
             status
      FROM dbo.Measures
      ORDER BY name;
    `);
    return result.recordset.map(mapMeasure);
  }

  async findById(measureId: number): Promise<MeasureRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('measureId', sql.Int, measureId)
      .query(`
        SELECT id_measure,
               name,
               abbreviation,
               status
        FROM dbo.Measures
        WHERE id_measure = @measureId;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapMeasure(result.recordset[0]);
  }

  async create(data: { name: string; abbreviation: string; state?: boolean; }): Promise<MeasureRecord> {
    const pool = await getConnection();
    const insertResult = await pool.request()
      .input('name', sql.NVarChar(100), data.name)
      .input('abbreviation', sql.NVarChar(20), data.abbreviation)
      .input('state', sql.Bit, data.state ?? true)
      .query(`
        INSERT INTO dbo.Measures ([name], abbreviation, [status])
        OUTPUT inserted.id_measure
        VALUES (@name, @abbreviation, @state);
      `);
    const created = (await this.findById(insertResult.recordset[0].id_measure))!;
    replicateUpsertMeasure(created);
    return created;
  }

  async update(measureId: number, data: { name?: string; abbreviation?: string; state?: boolean; }): Promise<MeasureRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(measureId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('name', sql.NVarChar(100), data.name ?? existing.name)
      .input('abbreviation', sql.NVarChar(20), data.abbreviation ?? existing.abbreviation)
      .input('state', sql.Bit, data.state ?? existing.state)
      .input('measureId', sql.Int, measureId)
      .query(`
        UPDATE dbo.Measures
        SET [name] = @name,
            abbreviation = @abbreviation,
            [status] = @state
        WHERE id_measure = @measureId;
      `);
    const updated = await this.findById(measureId);
    if (updated) replicateUpsertMeasure(updated);
    return updated;
  }

  async delete(measureId: number): Promise<MeasureRecord | null> {
    const pool = await getConnection();
    const existing = await this.findById(measureId);
    if (!existing) {
      return null;
    }
    await pool.request()
      .input('measureId', sql.Int, measureId)
      .query('DELETE FROM dbo.Measures WHERE id_measure = @measureId;');
    replicateDeleteMeasure(measureId);
    return existing;
  }
}

export const measuresRepository = new MeasuresRepository();
