import { asyncHandler } from './asyncHandler.js';
import { clientsRepository, type ClientRecord } from '../repositories/clients.repository.js';

const parseClientId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de cliente inválido');
  }
  return id;
};

const mapClientResponse = (client: ClientRecord) => ({
  clientId: client.clientId,
  documentNumber: client.documentNumber,
  name: client.name,
  lastName: client.lastName,
  phone: client.phone,
  mail: client.email,
  email: client.email,
  direction: client.address,
  address: client.address,
  state: true
});

export const listClients = asyncHandler(async (_req, res) => {
  const clients = await clientsRepository.findAll();
  res.json(clients.map(mapClientResponse));
});

export const getClient = asyncHandler(async (req, res) => {
  let clientId: number;
  try {
    clientId = parseClientId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const client = await clientsRepository.findById(clientId);
  if (!client) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }
  res.json(mapClientResponse(client));
});

export const createClient = asyncHandler(async (req, res) => {
  const client = await clientsRepository.create({
    documentNumber: req.body.documentNumber ?? req.body.document,
    name: req.body.name,
    lastName: req.body.lastName ?? req.body.lastname,
    email: req.body.email ?? req.body.mail,
    phone: req.body.phone,
    address: req.body.address ?? req.body.direction
  });
  res.status(201).json(mapClientResponse(client));
});

export const updateClient = asyncHandler(async (req, res) => {
  if (!req.body.clientId) {
    return res.status(400).json({ message: 'clientId es requerido' });
  }
  let clientId: number;
  try {
    clientId = parseClientId(String(req.body.clientId));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await clientsRepository.update(clientId, {
    documentNumber: req.body.documentNumber ?? req.body.document,
    name: req.body.name,
    lastName: req.body.lastName ?? req.body.lastname,
    email: req.body.email ?? req.body.mail,
    phone: req.body.phone,
    address: req.body.address ?? req.body.direction
  });
  if (!updated) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }
  res.json(mapClientResponse(updated));
});

export const deleteClient = asyncHandler(async (req, res) => {
  let clientId: number;
  try {
    clientId = parseClientId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await clientsRepository.delete(clientId);
  if (!removed) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }
  res.json(mapClientResponse(removed));
});
