import { asyncHandler } from './asyncHandler.js';
import { branchesRepository } from '../repositories/branches.repository.js';
import { productBranchRepository } from '../repositories/productBranch.repository.js';
import { productsRepository } from '../repositories/products.repository.js';

const parseProductId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de producto inválido');
  }
  return id;
};

const parseBranchId = (value?: string) => {
  if (!value) {
    throw new Error('branchId es requerido');
  }
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de sucursal inválido');
  }
  return id;
};

export const listProducts = asyncHandler(async (_req, res) => {
  const products = await productsRepository.findAll();
  res.json(products);
});

export const listProductsByBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  if (!branchId) {
    const products = await productsRepository.findAll();
    return res.json(products);
  }
  let parsedBranch: number;
  try {
    parsedBranch = parseBranchId(branchId);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const products = await productsRepository.findByBranch(parsedBranch);
  if (products.length === 0) {
    const fallback = await productsRepository.findAll();
    return res.json(fallback);
  }
  res.json(products);
});

export const getProduct = asyncHandler(async (req, res) => {
  let productId: number;
  try {
    productId = parseProductId(req.params.id ?? req.params.productId);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const product = await productsRepository.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }
  res.json(product);
});

export const getProductFromBranch = asyncHandler(async (req, res) => {
  let productId: number;
  try {
    productId = parseProductId(req.params.productId);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const product = await productsRepository.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }
  if (req.params.branchId) {
    let branchId: number;
    try {
      branchId = parseBranchId(req.params.branchId);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
    const configs = await productBranchRepository.listByProduct(productId);
    const allowed = configs.find((config) => Number(config.branchId) === branchId && config.enable);
    if (!allowed) {
      return res.status(404).json({ message: 'Producto no disponible en la sucursal' });
    }
  }
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = {
    codeBar: req.body.CodeBar ?? req.body.codeBar,
    name: req.body.Name ?? req.body.name,
    description: req.body.Description ?? req.body.description ?? null,
    categoryId: Number(req.body.CategoryId ?? req.body.categoryId),
    brandId: Number(req.body.BrandId ?? req.body.brandId),
    measureId: Number(req.body.MeasureId ?? req.body.measureId),
    providerId: Number(req.body.ProviderId ?? req.body.providerId),
    state: req.body.State ?? req.body.state ?? true
  };
  const ids = [payload.categoryId, payload.brandId, payload.measureId, payload.providerId];
  if ([payload.codeBar, payload.name].some((value) => !value) || ids.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ message: 'Datos incompletos para crear el producto' });
  }
  const product = await productsRepository.create(payload);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  if (!req.body.ProductId && !req.body.productId) {
    return res.status(400).json({ message: 'productId es requerido' });
  }
  let productId: number;
  try {
    productId = parseProductId(String(req.body.ProductId ?? req.body.productId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await productsRepository.update(productId, {
    codeBar: req.body.CodeBar ?? req.body.codeBar,
    name: req.body.Name ?? req.body.name,
    description: req.body.Description ?? req.body.description,
    categoryId: req.body.CategoryId ?? req.body.categoryId,
    brandId: req.body.BrandId ?? req.body.brandId,
    measureId: req.body.MeasureId ?? req.body.measureId,
    providerId: req.body.ProviderId ?? req.body.providerId,
    state: req.body.State ?? req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }
  res.json(updated);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  let productId: number;
  try {
    productId = parseProductId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await productsRepository.delete(productId);
  if (!removed) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }
  res.json(removed);
});

export const getProductBranches = asyncHandler(async (req, res) => {
  let productId: number;
  try {
    productId = parseProductId(req.params.productId);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const product = await productsRepository.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }
  const [branches, productBranches] = await Promise.all([
    branchesRepository.findAll(),
    productBranchRepository.listByProduct(productId)
  ]);
  const response = branches.map((branch) => {
    const config = productBranches.find((pb) => pb.branchId === branch.branchId);
    return {
      branchID: branch.branchId,
      branchName: branch.name,
      enable: config?.enable ?? false,
      stock: config?.stock ?? 0,
      price: config?.price ?? 0,
      cost: config?.cost ?? 0
    };
  });
  res.json(response);
});

export const updateProductBranches = asyncHandler(async (req, res) => {
  let productId: number;
  try {
    productId = parseProductId(req.params.productId);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const product = await productsRepository.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }
  const payload = Array.isArray(req.body) ? req.body : req.body?.branches ?? [];
  const branches = await branchesRepository.findAll();
  const validIds = new Set(branches.map((branch) => branch.branchId));
  type NormalizedBranch = { branchId: string; enable: boolean; stock: number; price: number; cost: number };
  const mapped: NormalizedBranch[] = payload
    .map((branch: any) => ({
      branchId: String(branch.branchID ?? branch.branchId),
      enable: branch.enable ?? true,
      stock: Number(branch.stock ?? 0),
      price: Number(branch.price ?? branch.unitPrice ?? product.unitPrice ?? 0),
      cost: Number(branch.cost ?? branch.purchasePrice ?? product.purchasePrice ?? 0)
    }));
  const normalized = mapped.filter((item) => item.branchId && validIds.has(item.branchId));

  await productBranchRepository.replaceProductBranches(
    productId,
    normalized.map((item) => ({
      branchId: Number(item.branchId),
      enable: item.enable,
      stock: item.stock,
      price: item.price,
      cost: item.cost
    }))
  );

  res.json(true);
});
