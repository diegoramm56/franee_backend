import { Router } from 'express';

import {
  createBranch,
  deleteBranch,
  getBranch,
  listBranches,
  updateBranch
} from '../controllers/branches.controller.js';

const router = Router();

router.get('/', listBranches);
router.get('/:id', getBranch);
router.post('/', createBranch);
router.put('/', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
