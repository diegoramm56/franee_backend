import { asyncHandler } from './asyncHandler.js';
import { branchesRepository } from '../repositories/branches.repository.js';

const parseBranchId = (value: string) => {
  const branchId = Number(value);
  if (!Number.isInteger(branchId)) {
    throw new Error('Identificador de sucursal inválido');
  }
  return branchId;
};

export const listBranches = asyncHandler(async (_req, res) => {
  const branches = await branchesRepository.findAll();
  res.json(branches);
});

export const getBranch = asyncHandler(async (req, res) => {
  let branchId: number;
  try {
    branchId = parseBranchId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const branch = await branchesRepository.findById(branchId);
  if (!branch) {
    return res.status(404).json({ message: 'Sucursal no encontrada' });
  }
  res.json(branch);
});

export const createBranch = asyncHandler(async (req, res) => {
  const branch = await branchesRepository.create({
    name: req.body.name,
    address: req.body.address ?? null,
    phone: req.body.phone ?? null,
    state: req.body.state ?? true
  });
  res.status(201).json(branch);
});

export const updateBranch = asyncHandler(async (req, res) => {
  if (!req.body.branchId) {
    return res.status(400).json({ message: 'branchId es requerido' });
  }
  let branchId: number;
  try {
    branchId = parseBranchId(String(req.body.branchId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await branchesRepository.update(branchId, {
    name: req.body.name,
    address: req.body.address,
    phone: req.body.phone,
    state: req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Sucursal no encontrada' });
  }
  res.json(updated);
});

export const deleteBranch = asyncHandler(async (req, res) => {
  let branchId: number;
  try {
    branchId = parseBranchId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await branchesRepository.delete(branchId);
  if (!removed) {
    return res.status(404).json({ message: 'Sucursal no encontrada' });
  }
  res.json(removed);
});
