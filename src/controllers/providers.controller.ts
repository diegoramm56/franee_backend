import { asyncHandler } from './asyncHandler.js';
import { providersRepository, type ProviderRecord } from '../repositories/providers.repository.js';

const parseProviderId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de proveedor inválido');
  }
  return id;
};

const mapProviderResponse = (provider: ProviderRecord) => ({
  providerId: provider.providerId,
  name: provider.name,
  nit: provider.nit,
  contact: provider.contact,
  phone: provider.phone,
  mail: provider.email,
  email: provider.email,
  direction: provider.address,
  address: provider.address,
  state: provider.state
});

export const listProviders = asyncHandler(async (_req, res) => {
  const providers = await providersRepository.findAll();
  res.json(providers.map(mapProviderResponse));
});

export const getProvider = asyncHandler(async (req, res) => {
  let providerId: number;
  try {
    providerId = parseProviderId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const provider = await providersRepository.findById(providerId);
  if (!provider) {
    return res.status(404).json({ message: 'Proveedor no encontrado' });
  }
  res.json(mapProviderResponse(provider));
});

export const createProvider = asyncHandler(async (req, res) => {
  const provider = await providersRepository.create({
    name: req.body.Name ?? req.body.name,
    nit: req.body.Nit ?? req.body.nit,
    contact: req.body.Contact ?? req.body.contact ?? null,
    phone: req.body.Phone ?? req.body.phone ?? null,
    email: req.body.Email ?? req.body.email ?? null,
    address: req.body.Address ?? req.body.address ?? null,
    state: req.body.State ?? req.body.state ?? true
  });
  res.status(201).json(mapProviderResponse(provider));
});

export const updateProvider = asyncHandler(async (req, res) => {
  if (!req.body.ProviderId && !req.body.providerId) {
    return res.status(400).json({ message: 'providerId es requerido' });
  }
  let providerId: number;
  try {
    providerId = parseProviderId(String(req.body.ProviderId ?? req.body.providerId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await providersRepository.update(providerId, {
    name: req.body.Name ?? req.body.name,
    nit: req.body.Nit ?? req.body.nit,
    contact: req.body.Contact ?? req.body.contact,
    phone: req.body.Phone ?? req.body.phone,
    email: req.body.Email ?? req.body.email,
    address: req.body.Address ?? req.body.address,
    state: req.body.State ?? req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Proveedor no encontrado' });
  }
  res.json(mapProviderResponse(updated));
});

export const deleteProvider = asyncHandler(async (req, res) => {
  let providerId: number;
  try {
    providerId = parseProviderId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await providersRepository.delete(providerId);
  if (!removed) {
    return res.status(404).json({ message: 'Proveedor no encontrado' });
  }
  res.json(mapProviderResponse(removed));
});
