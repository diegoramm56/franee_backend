import { asyncHandler } from './asyncHandler.js';
import { measuresRepository } from '../repositories/measures.repository.js';

const parseMeasureId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error('Identificador de medida inválido');
  }
  return id;
};

export const listMeasures = asyncHandler(async (_req, res) => {
  const measures = await measuresRepository.findAll();
  res.json(measures);
});

export const getMeasure = asyncHandler(async (req, res) => {
  let measureId: number;
  try {
    measureId = parseMeasureId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const measure = await measuresRepository.findById(measureId);
  if (!measure) {
    return res.status(404).json({ message: 'Medida no encontrada' });
  }
  res.json(measure);
});

export const createMeasure = asyncHandler(async (req, res) => {
  const measure = await measuresRepository.create({
    name: req.body.Name ?? req.body.name,
    abbreviation: req.body.Abbreviation ?? req.body.abbreviation ?? req.body.shortName,
    state: req.body.State ?? req.body.state ?? true
  });
  res.status(201).json(measure);
});

export const updateMeasure = asyncHandler(async (req, res) => {
  const identifier = req.body.MeasureId ?? req.body.measureId ?? req.body.id;
  if (!identifier) {
    return res.status(400).json({ message: 'measureId es requerido' });
  }
  let measureId: number;
  try {
    measureId = parseMeasureId(String(identifier));
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const updated = await measuresRepository.update(measureId, {
    name: req.body.Name ?? req.body.name,
    abbreviation: req.body.Abbreviation ?? req.body.abbreviation ?? req.body.shortName,
    state: req.body.State ?? req.body.state
  });
  if (!updated) {
    return res.status(404).json({ message: 'Medida no encontrada' });
  }
  res.json(updated);
});

export const deleteMeasure = asyncHandler(async (req, res) => {
  let measureId: number;
  try {
    measureId = parseMeasureId(req.params.id);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
  const removed = await measuresRepository.delete(measureId);
  if (!removed) {
    return res.status(404).json({ message: 'Medida no encontrada' });
  }
  res.json(removed);
});
