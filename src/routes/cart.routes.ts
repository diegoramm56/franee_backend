import { Router } from 'express';

import {
  addCartItem,
  clearCart,
  deleteCartItem,
  getCartByUserBranch,
  updateCartItem
} from '../controllers/cart.controller.js';

const router = Router();

router.get('/:userId/:branchId', getCartByUserBranch);
router.post('/', addCartItem);
router.put('/', updateCartItem);
router.delete('/clear', clearCart);
router.delete('/:id', deleteCartItem);

export default router;
