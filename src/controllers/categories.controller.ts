import { asyncHandler } from './asyncHandler.js';
import { categoriesRepository } from '../repositories/categories.repository.js';

const parseCategoryId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de categoría inválido');
  }
  return id;
};

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await categoriesRepository.findAll();
  res.json(categories);
});

export const getCategory = asyncHandler(async (req, res) => {
  let categoryId: number;
  try {
    categoryId = parseCategoryId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const category = await categoriesRepository.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }
  res.json(category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoriesRepository.create({
    name: req.body.Name ?? req.body.name,
    description: req.body.Description ?? req.body.description ?? null,
    state: req.body.State ?? req.body.state ?? true
  });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const identifier = req.body.CategoryId ?? req.body.categoryId ?? req.body.id;
  if (!identifier) {
    return res.status(400).json({ message: 'categoryId es requerido' });
  }
  let categoryId: number;
  try {
    categoryId = parseCategoryId(String(identifier));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await categoriesRepository.update(categoryId, {
    name: req.body.Name ?? req.body.name,
    description: req.body.Description ?? req.body.description,
    state: req.body.State ?? req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }
  res.json(updated);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  let categoryId: number;
  try {
    categoryId = parseCategoryId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await categoriesRepository.delete(categoryId);
  if (!removed) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }
  res.json(removed);
});
