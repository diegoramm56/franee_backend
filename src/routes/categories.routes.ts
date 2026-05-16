import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory
} from '../controllers/categories.controller.js';

const router = Router();

router.get('/', listCategories);
router.get('/:id', getCategory);
router.post('/', createCategory);
router.put('/', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
