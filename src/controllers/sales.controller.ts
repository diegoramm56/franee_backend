import { asyncHandler } from './asyncHandler.js';
import { saleDetailsRepository } from '../repositories/saleDetails.repository.js';
import { salesRepository } from '../repositories/sales.repository.js';
import { store } from '../data/store.js';

const parseSaleId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de venta inválido');
  }
  return id;
};

export const listSales = asyncHandler(async (_req, res) => {
  const sales = await salesRepository.findAll();
  res.json(sales);
});

export const getSale = asyncHandler(async (req, res) => {
  let saleId: number;
  try {
    saleId = parseSaleId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const sale = await salesRepository.findById(saleId);
  if (!sale) {
    return res.status(404).json({ message: 'Venta no encontrada' });
  }
  res.json(sale);
});

export const createSale = asyncHandler(async (req, res) => {
  const salePayload = req.body.sale ?? {};
  if (!salePayload.clientId || !salePayload.branchId || !salePayload.userId) {
    return res.status(400).json({ message: 'Datos incompletos para crear la venta' });
  }
  const detailsPayload = Array.isArray(req.body.details) ? req.body.details : [];
  if (detailsPayload.length === 0) {
    return res.status(400).json({ message: 'Se requieren detalles de venta' });
  }
  const input = {
    clientId: Number(salePayload.clientId),
    userId: Number(salePayload.userId),
    branchId: Number(salePayload.branchId),
    totalAmount: Number(salePayload.total ?? 0),
    discountApplied: Number(salePayload.discount ?? salePayload.discountApplied ?? 0),
    paymentMethod: salePayload.paymentMethod ?? 'EFECTIVO',
    status: salePayload.status ?? 'COMPLETED',
    details: detailsPayload.map((detail: any) => ({
      productId: Number(detail.productId),
      quantity: Number(detail.quantity ?? 0),
      unitPrice: Number(detail.unitPrice ?? detail.salePrice ?? 0),
      purchasePrice: Number(detail.purchasePrice ?? detail.cost ?? 0),
      salePrice: Number(detail.salePrice ?? detail.unitPrice ?? 0),
      discount: Number(detail.discount ?? 0),
      subtotal: Number(detail.subtotal ?? detail.quantity * detail.unitPrice)
    }))
  };
  const result = await salesRepository.createWithDetails(input);
  // Mantener compatibilidad con el carrito en memoria
  store.carts = store.carts.filter((item) => item.userId !== String(input.userId) || item.branchId !== String(input.branchId));
  res.status(201).json(result);
});

export const listSaleDetails = asyncHandler(async (req, res) => {
  const { saleId } = req.query;
  if (typeof saleId !== 'string') {
    return res.status(400).json({ message: 'saleId es requerido' });
  }
  let parsedId: number;
  try {
    parsedId = parseSaleId(saleId);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const details = await saleDetailsRepository.listBySale(parsedId);
  res.json(details);
});
