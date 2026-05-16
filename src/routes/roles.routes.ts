import { Router } from 'express';

import {
  createRole,
  deleteRole,
  getAccess,
  getRole,
  listRoles,
  updateRole,
  updateRoleModules
} from '../controllers/roles.controller.js';

const router = Router();

router.get('/', listRoles);
router.get('/:id', getRole);
router.post('/', createRole);
router.put('/', updateRole);
router.delete('/:id', deleteRole);
router.get('/Access/:id', getAccess);
router.get('/ModuleAccess/:id', getAccess);
router.put('/ModuleAccess/:id', updateRoleModules);

export default router;
