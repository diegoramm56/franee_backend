import { Router } from 'express';

import {
  createProvider,
  deleteProvider,
  getProvider,
  listProviders,
  updateProvider
} from '../controllers/providers.controller.js';

const router = Router();

router.get('/', listProviders);
router.get('/:id', getProvider);
router.post('/', createProvider);
router.put('/', updateProvider);
router.delete('/:id', deleteProvider);

export default router;
