import { Router } from 'express';

import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductBranches,
  getProductFromBranch,
  listProducts,
  listProductsByBranch,
  updateProduct,
  updateProductBranches
} from '../controllers/products.controller.js';

const router = Router();

router.get('/branch/:branchId/:productId', getProductFromBranch);
router.get('/branch/:branchId', listProductsByBranch);
router.get('/item/:id', getProduct);
router.get('/', listProducts);
router.get('/branches/:productId', getProductBranches);
router.put('/branches/:productId', updateProductBranches);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
