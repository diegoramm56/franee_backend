import { asyncHandler } from './asyncHandler.js';
import { branchesRepository } from '../repositories/branches.repository.js';
import { rolesRepository } from '../repositories/roles.repository.js';
import { userBranchesRepository } from '../repositories/userBranches.repository.js';
import { usersRepository } from '../repositories/users.repository.js';

const parseUserId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de usuario inválido');
  }
  return id;
};

const SESSION_TIMEOUT_MINUTES = 10;

const normalizeBranchIds = (branches: any[]): number[] => branches
  .map((branch) => branch.branchId ?? branch.branchID ?? branch)
  .map((id) => Number(id))
  .filter((id) => Number.isInteger(id) && id > 0);

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await usersRepository.findAll();
  res.json(users);
});

export const getUser = asyncHandler(async (req, res) => {
  let userId: number;
  try {
    userId = parseUserId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const user = await usersRepository.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  res.json(user);
});

export const createUser = asyncHandler(async (req, res) => {
  const rolId = Number(req.body.rolId ?? req.body.RolId);
  if (!req.body.username || !req.body.name || !Number.isInteger(rolId)) {
    return res.status(400).json({ message: 'Datos incompletos para crear el usuario' });
  }
  const user = await usersRepository.create({
    username: req.body.username,
    name: req.body.name,
    password: req.body.password ?? '123456',
    rolId,
    email: req.body.email ?? null,
    state: req.body.state ?? true
  });
  if (Array.isArray(req.body.branchAccess)) {
    const branchIds = normalizeBranchIds(req.body.branchAccess);
    if (branchIds.length > 0) {
      await userBranchesRepository.replaceUserBranches(Number(user.userId), branchIds);
    }
  }
  const created = await usersRepository.findById(Number(user.userId));
  res.status(201).json(created);
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!req.body.userId) {
    return res.status(400).json({ message: 'userId es requerido' });
  }
  let userId: number;
  try {
    userId = parseUserId(String(req.body.userId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await usersRepository.update(userId, {
    username: req.body.username,
    name: req.body.name,
    password: req.body.password,
    rolId: req.body.rolId ?? req.body.RolId,
    email: req.body.email,
    state: req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  if (Array.isArray(req.body.branchAccess)) {
    const branchIds = normalizeBranchIds(req.body.branchAccess);
    await userBranchesRepository.replaceUserBranches(userId, branchIds);
  }
  const refreshed = await usersRepository.findById(userId);
  res.json(refreshed);
});

export const deleteUser = asyncHandler(async (req, res) => {
  let userId: number;
  try {
    userId = parseUserId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await usersRepository.delete(userId);
  if (!removed) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  res.json(removed);
});

export const beginSession = asyncHandler(async (req, res) => {
  const { Username, Password } = req.body;
  if (!Username || !Password) {
    return res.json(false);
  }
  const user = await usersRepository.findByCredentials(Username, Password);
  if (!user) {
    return res.json(false);
  }
  if (!user.state) {
    return res.json(false);
  }
  const role = await rolesRepository.findById(Number(user.rolId));
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TIMEOUT_MINUTES * 60 * 1000);
  res.json({
    userId: user.userId,
    username: user.username,
    name: user.name,
    rolID: user.rolId,
    rol: role?.name ?? 'Sin rol',
    sessionIssuedAt: issuedAt.toISOString(),
    sessionExpiresAt: expiresAt.toISOString(),
    sessionTimeoutMinutes: SESSION_TIMEOUT_MINUTES
  });
});

export const getAccess = asyncHandler(async (req, res) => {
  let userId: number;
  try {
    userId = parseUserId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const user = await usersRepository.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  const branches = await branchesRepository.findAll();
  const allowed = user.branchAccess.length > 0
    ? branches.filter((branch) => user.branchAccess.includes(branch.branchId))
    : branches;
  res.json(allowed.map((branch) => ({
    branchID: branch.branchId,
    branchName: branch.name
  })));
});

export const getBranchAccess = asyncHandler(async (req, res) => {
  let userId: number;
  try {
    userId = parseUserId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const user = await usersRepository.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  const branches = await branchesRepository.findAll();
  const response = branches.map((branch) => ({
    branchId: branch.branchId,
    branchName: branch.name,
    allowed: user.branchAccess.length === 0 || user.branchAccess.includes(branch.branchId)
  }));
  res.json(response);
});

export const updateBranchAccess = asyncHandler(async (req, res) => {
  let userId: number;
  try {
    userId = parseUserId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const user = await usersRepository.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  const branches = Array.isArray(req.body)
    ? req.body
    : Array.isArray(req.body.branches)
      ? req.body.branches
      : [];
  const branchIds = normalizeBranchIds(branches);
  await userBranchesRepository.replaceUserBranches(userId, branchIds);
  const refreshed = await usersRepository.findById(userId);
  res.json(refreshed?.branchAccess ?? []);
});
