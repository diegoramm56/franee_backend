import { Router } from 'express';

import {
  createSale,
  getSale,
  listSaleDetails,
  listSales
} from '../controllers/sales.controller.js';

const router = Router();

router.get('/', listSales);
router.get('/:id', getSale);
router.post('/', createSale);

const saleDetailRouter = Router();

saleDetailRouter.get('/', listSaleDetails);

export { saleDetailRouter };
export default router;
