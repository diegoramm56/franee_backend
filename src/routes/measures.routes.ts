import { Router } from 'express';

import {
  createMeasure,
  deleteMeasure,
  getMeasure,
  listMeasures,
  updateMeasure
} from '../controllers/measures.controller.js';

const router = Router();

router.get('/', listMeasures);
router.get('/:id', getMeasure);
router.post('/', createMeasure);
router.put('/', updateMeasure);
router.delete('/:id', deleteMeasure);

export default router;
