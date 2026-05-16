import { Router } from 'express';

import {
  createBrand,
  deleteBrand,
  getBrand,
  listBrands,
  updateBrand
} from '../controllers/brands.controller.js';

const router = Router();

router.get('/', listBrands);
router.get('/:id', getBrand);
router.post('/', createBrand);
router.put('/', updateBrand);
router.delete('/:id', deleteBrand);

export default router;
