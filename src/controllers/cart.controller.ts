import { asyncHandler } from './asyncHandler.js';
import { createId, store } from '../data/store.js';

export const getCartByUserBranch = asyncHandler((req, res) => {
  const { userId, branchId } = req.params;
  const items = store.carts.filter((c) => c.userId === userId && c.branchId === branchId);
  res.json(items);
});

export const addCartItem = asyncHandler((req, res) => {
  const cartItem = {
    ...req.body,
    cartId: createId(),
    userId: String(req.body.userId),
    branchId: String(req.body.branchId),
    productId: req.body.productId,
    quantity: req.body.quantity,
    unitPrice: req.body.unitPrice,
    purchasePrice: req.body.purchasePrice ?? req.body.unitPrice,
    discount: req.body.discount ?? 0,
    salePrice: req.body.salePrice ?? req.body.unitPrice
  };
  store.carts.push(cartItem);
  res.status(201).json(cartItem);
});

export const updateCartItem = asyncHandler((req, res) => {
  const index = store.carts.findIndex((c) => c.cartId === req.body.cartId);
  if (index === -1) {
    return res.status(404).json({ message: 'Elemento no encontrado' });
  }
  store.carts[index] = {
    ...store.carts[index],
    ...req.body
  };
  res.json(store.carts[index]);
});

export const deleteCartItem = asyncHandler((req, res) => {
  const index = store.carts.findIndex((c) => c.cartId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Elemento no encontrado' });
  }
  const removed = store.carts.splice(index, 1)[0];
  res.json(removed);
});

export const clearCart = asyncHandler((_req, res) => {
  store.carts = [];
  res.json({ message: 'Carrito vaciado' });
});
