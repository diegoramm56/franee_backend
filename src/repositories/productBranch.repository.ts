import { getConnection, sql } from '../config/database.js';

export interface ProductBranchRecord {
  productId: string;
  branchId: string;
  stock: number;
  price: number;
  cost: number;
  enable: boolean;
}

const mapRecord = (row: any): ProductBranchRecord => {
  const stock = Number(row.stock ?? 0);
  return {
    productId: String(row.id_product),
    branchId: String(row.id_branch),
    stock,
    price: Number(row.price ?? 0),
    cost: Number(row.cost ?? 0),
    enable: stock > 0
  };
};

export interface ProductBranchInput {
  branchId: number;
  stock: number;
  price: number;
  cost: number;
  enable?: boolean;
}

export class ProductBranchRepository {
  async listByProduct(productId: number): Promise<ProductBranchRecord[]> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT id_product,
               id_branch,
               stock,
               price,
               cost
        FROM dbo.Product_Branch
        WHERE id_product = @productId;
      `);
    return result.recordset.map(mapRecord);
  }

  async replaceProductBranches(productId: number, branches: ProductBranchInput[]): Promise<void> {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      await new sql.Request(transaction)
        .input('productId', sql.Int, productId)
        .query('DELETE FROM dbo.Product_Branch WHERE id_product = @productId;');

      for (const branch of branches) {
        const stockValue = branch.enable === false ? 0 : Math.max(0, branch.stock);
        await new sql.Request(transaction)
          .input('productId', sql.Int, productId)
          .input('branchId', sql.Int, branch.branchId)
          .input('stock', sql.Decimal(18, 2), stockValue)
          .input('price', sql.Decimal(18, 2), Math.max(0, branch.price))
          .input('cost', sql.Decimal(18, 2), Math.max(0, branch.cost))
          .query(`
            INSERT INTO dbo.Product_Branch (id_product, id_branch, stock, price, cost)
            VALUES (@productId, @branchId, @stock, @price, @cost);
          `);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async decrementStock(productId: number, branchId: number, quantity: number, transaction: sql.Transaction): Promise<void> {
    const request = new sql.Request(transaction)
      .input('productId', sql.Int, productId)
      .input('branchId', sql.Int, branchId)
      .input('quantity', sql.Decimal(18, 2), quantity);

    const result = await request.query(`
      UPDATE dbo.Product_Branch
      SET stock = stock - @quantity
      WHERE id_product = @productId AND id_branch = @branchId AND stock >= @quantity;
    `);

    if (result.rowsAffected[0] === 0) {
      throw new Error('Stock insuficiente o producto no configurado en la sucursal');
    }
  }
}

export const productBranchRepository = new ProductBranchRepository();
