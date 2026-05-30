import { getConnection, sql } from '../config/database.js';
import { replicateInsertSale, replicateInsertSaleDetail } from '../replication/pgReplicator.js';
import { productBranchRepository } from './productBranch.repository.js';
import { saleDetailsRepository, SaleDetailInput, SaleDetailRecord } from './saleDetails.repository.js';

export interface SaleRecord {
  saleId: string;
  clientId: string;
  userId: string;
  branchId: string;
  saleDate: string;
  totalAmount: number;
  discountApplied: number;
  paymentMethod: string;
  status: string;
}

const mapSale = (row: any): SaleRecord => ({
  saleId: String(row.id_sale),
  clientId: String(row.id_client),
  userId: String(row.id_user),
  branchId: String(row.id_branch),
  saleDate: row.sale_date?.toISOString?.() ?? row.sale_date,
  totalAmount: Number(row.total_amount),
  discountApplied: Number(row.discount_applied ?? 0),
  paymentMethod: row.payment_method,
  status: row.status
});

export interface CreateSaleInput {
  clientId: number;
  userId: number;
  branchId: number;
  totalAmount: number;
  discountApplied?: number;
  paymentMethod: string;
  status?: string;
  details: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    purchasePrice: number;
    salePrice?: number;
    discount?: number;
    subtotal?: number;
  }>;
}

export class SalesRepository {
  async findAll(): Promise<SaleRecord[]> {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_sale,
             id_client,
             id_user,
             id_branch,
             sale_date,
             total_amount,
             discount_applied,
             payment_method,
             [status]
      FROM dbo.Sales
      ORDER BY sale_date DESC;
    `);
    return result.recordset.map(mapSale);
  }

  async findById(saleId: number): Promise<SaleRecord | null> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('saleId', sql.Int, saleId)
      .query(`
        SELECT id_sale,
               id_client,
               id_user,
               id_branch,
               sale_date,
               total_amount,
               discount_applied,
               payment_method,
               [status]
        FROM dbo.Sales
        WHERE id_sale = @saleId;
      `);
    if (result.recordset.length === 0) {
      return null;
    }
    return mapSale(result.recordset[0]);
  }

  async createWithDetails(input: CreateSaleInput): Promise<{ sale: SaleRecord; details: SaleDetailRecord[]; }> {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const saleRequest = new sql.Request(transaction)
        .input('clientId', sql.Int, input.clientId)
        .input('userId', sql.Int, input.userId)
        .input('branchId', sql.Int, input.branchId)
        .input('totalAmount', sql.Decimal(18, 2), input.totalAmount)
        .input('discount', sql.Decimal(18, 2), input.discountApplied ?? 0)
        .input('paymentMethod', sql.NVarChar(50), input.paymentMethod)
        .input('status', sql.NVarChar(20), input.status ?? 'COMPLETED');

      const saleResult = await saleRequest.query(`
        INSERT INTO dbo.Sales (id_client, id_user, id_branch, total_amount, discount_applied, payment_method, [status])
        OUTPUT inserted.id_sale,
               inserted.id_client,
               inserted.id_user,
               inserted.id_branch,
               inserted.sale_date,
               inserted.total_amount,
               inserted.discount_applied,
               inserted.payment_method,
               inserted.[status]
        VALUES (@clientId, @userId, @branchId, @totalAmount, @discount, @paymentMethod, @status);
      `);

      const saleRow = saleResult.recordset[0];
      const saleId = saleRow.id_sale as number;
      const details: SaleDetailRecord[] = [];

      for (const detail of input.details) {
        const detailRecord = await saleDetailsRepository.insertDetail({
          saleId,
          productId: detail.productId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          purchasePrice: detail.purchasePrice,
          salePrice: detail.salePrice,
          discount: detail.discount,
          subtotal: detail.subtotal
        } as SaleDetailInput, transaction);
        details.push(detailRecord);
        await productBranchRepository.decrementStock(detail.productId, input.branchId, detail.quantity, transaction);
      }

      await transaction.commit();
      const saleRecord = mapSale(saleRow);
      replicateInsertSale(saleRecord);
      for (const d of details) replicateInsertSaleDetail(d);
      return {
        sale: saleRecord,
        details
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const salesRepository = new SalesRepository();
