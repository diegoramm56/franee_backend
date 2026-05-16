import { asyncHandler } from './asyncHandler.js';
import { roleAccessRepository } from '../repositories/roleAccess.repository.js';
import { rolesRepository } from '../repositories/roles.repository.js';

const parseRoleId = (value: string) => {
  const roleId = Number(value);
  if (!Number.isInteger(roleId)) {
    throw new Error('Identificador de rol inválido');
  }
  return roleId;
};

const parseModuleNames = (payload: any): string[] => {
  const modules = Array.isArray(payload?.modules)
    ? payload.modules
    : Array.isArray(payload)
      ? payload
      : [];
  return modules
    .map((mod) => (typeof mod === 'string' ? mod : mod?.moduleName ?? mod?.name))
    .filter((mod): mod is string => Boolean(mod));
};

export const listRoles = asyncHandler(async (_req, res) => {
  const roles = await rolesRepository.findAll();
  res.json(roles);
});

export const getRole = asyncHandler(async (req, res) => {
  let roleId: number;
  try {
    roleId = parseRoleId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const role = await rolesRepository.findById(roleId);
  if (!role) {
    return res.status(404).json({ message: 'Rol no encontrado' });
  }
  res.json(role);
});

export const createRole = asyncHandler(async (req, res) => {
  const modules = parseModuleNames(req.body);
  const role = await rolesRepository.create({
    name: req.body.name,
    description: req.body.description ?? null,
    state: req.body.state ?? true
  });
  if (modules.length > 0) {
    await roleAccessRepository.replaceRoleModules(Number(role.rolId), modules.map((moduleName) => ({ moduleName })));
  }
  const created = await rolesRepository.findById(Number(role.rolId));
  res.status(201).json(created);
});

export const updateRole = asyncHandler(async (req, res) => {
  if (!req.body.rolId) {
    return res.status(400).json({ message: 'rolId es requerido' });
  }
  let roleId: number;
  try {
    roleId = parseRoleId(String(req.body.rolId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await rolesRepository.update(roleId, {
    name: req.body.name,
    description: req.body.description,
    state: req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Rol no encontrado' });
  }
  res.json(updated);
});

export const deleteRole = asyncHandler(async (req, res) => {
  let roleId: number;
  try {
    roleId = parseRoleId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await rolesRepository.delete(roleId);
  if (!removed) {
    return res.status(404).json({ message: 'Rol no encontrado' });
  }
  res.json(removed);
});

export const getAccess = asyncHandler(async (req, res) => {
  let roleId: number;
  try {
    roleId = parseRoleId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const role = await rolesRepository.findById(roleId);
  if (!role) {
    return res.status(404).json({ message: 'Rol no encontrado' });
  }
  const modules = (await roleAccessRepository.listByRole(roleId)).map((access, index) => ({
    moduleID: `${role.rolId}-${index}`,
    moduleName: access.moduleName,
    father: null,
    link: `/${access.moduleName}`,
    icon: 'bi bi-dot',
    canView: access.canView,
    canAdd: access.canAdd,
    canEdit: access.canEdit,
    canDelete: access.canDelete
  }));
  res.json(modules);
});

export const updateRoleModules = asyncHandler(async (req, res) => {
  let roleId: number;
  try {
    roleId = parseRoleId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const modules = parseModuleNames(req.body);
  await roleAccessRepository.replaceRoleModules(roleId, modules.map((moduleName) => ({ moduleName })));
  const refreshed = await rolesRepository.findById(roleId);
  res.json(refreshed);
});
