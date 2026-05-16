import { Router } from 'express';

import {
  beginSession,
  createUser,
  deleteUser,
  getAccess,
  getBranchAccess,
  getUser,
  listUsers,
  updateBranchAccess,
  updateUser
} from '../controllers/users.controller.js';

const router = Router();

router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/', updateUser);
router.delete('/:id', deleteUser);
router.post('/Session', beginSession);
router.get('/Access/:id', getAccess);
router.get('/BranchAccess/:id', getBranchAccess);
router.put('/BranchAccess/:id', updateBranchAccess);

export default router;
