import { getConnection, sql } from '../config/database.js';

export interface SaleDetailRecord {
  saleDetailId: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  salePrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleDetailInput {
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  salePrice?: number;
  discount?: number;
  subtotal?: number;
}

const mapDetail = (row: any): SaleDetailRecord => ({
  saleDetailId: String(row.id_sale_detail),
  saleId: String(row.id_sale),
  productId: String(row.id_product),
  quantity: Number(row.quantity),
  unitPrice: Number(row.unit_price),
  purchasePrice: Number(row.purchase_price ?? row.unit_price), // Fallback
  salePrice: Number(row.sale_price ?? row.unit_price), // Fallback
  discount: Number(row.discount_applied ?? row.discount ?? 0),
  subtotal: Number(row.subtotal)
});

export class SaleDetailsRepository {
  async listBySale(saleId: number): Promise<SaleDetailRecord[]> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('saleId', sql.Int, saleId)
      .query(`
        SELECT id_sale_detail,
               id_sale,
               id_product,
               quantity,
               unit_price,
               subtotal
        FROM dbo.Sale_Details
        WHERE id_sale = @saleId;
      `);
    return result.recordset.map(mapDetail);
  }

  async insertDetail(input: SaleDetailInput, transaction: sql.Transaction): Promise<SaleDetailRecord> {
    const request = new sql.Request(transaction)
      .input('saleId', sql.Int, input.saleId)
      .input('productId', sql.Int, input.productId)
      .input('quantity', sql.Decimal(18, 2), input.quantity)
      .input('unitPrice', sql.Decimal(18, 2), input.unitPrice)
      .input('subtotal', sql.Decimal(18, 2), input.subtotal ?? input.quantity * input.unitPrice);

    const result = await request.query(`
      INSERT INTO dbo.Sale_Details (id_sale, id_product, quantity, unit_price, subtotal)
      OUTPUT inserted.id_sale_detail,
             inserted.id_sale,
             inserted.id_product,
             inserted.quantity,
             inserted.unit_price,
             inserted.subtotal
      VALUES (@saleId, @productId, @quantity, @unitPrice, @subtotal);
    `);

    return mapDetail(result.recordset[0]);
  }
}

export const saleDetailsRepository = new SaleDetailsRepository();
