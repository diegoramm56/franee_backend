import { asyncHandler } from './asyncHandler.js';
import { brandsRepository } from '../repositories/brands.repository.js';

const parseBrandId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de marca inválido');
  }
  return id;
};

export const listBrands = asyncHandler(async (_req, res) => {
  const brands = await brandsRepository.findAll();
  res.json(brands);
});

export const getBrand = asyncHandler(async (req, res) => {
  let brandId: number;
  try {
    brandId = parseBrandId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const brand = await brandsRepository.findById(brandId);
  if (!brand) {
    return res.status(404).json({ message: 'Marca no encontrada' });
  }
  res.json(brand);
});

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandsRepository.create({
    name: req.body.Name ?? req.body.name,
    state: req.body.State ?? req.body.state ?? true
  });
  res.status(201).json(brand);
});

export const updateBrand = asyncHandler(async (req, res) => {
  const identifier = req.body.BrandId ?? req.body.brandId ?? req.body.id;
  if (!identifier) {
    return res.status(400).json({ message: 'brandId es requerido' });
  }
  let brandId: number;
  try {
    brandId = parseBrandId(String(identifier));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await brandsRepository.update(brandId, {
    name: req.body.Name ?? req.body.name,
    state: req.body.State ?? req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Marca no encontrada' });
  }
  res.json(updated);
});

export const deleteBrand = asyncHandler(async (req, res) => {
  let brandId: number;
  try {
    brandId = parseBrandId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await brandsRepository.delete(brandId);
  if (!removed) {
    return res.status(404).json({ message: 'Marca no encontrada' });
  }
  res.json(removed);
});
