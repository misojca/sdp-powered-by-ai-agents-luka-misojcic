const { Router } = require('express');

const router = Router();

// In-memory cart store: userId -> Map<bookId, quantity>
const carts = {};

function getUserId(req) {
  // Derive a stable userId from the Bearer token (no real JWT needed yet)
  const auth = req.headers.authorization || '';
  return auth.replace('Bearer ', '') || 'anonymous';
}

function getCart(userId) {
  if (!carts[userId]) carts[userId] = new Map();
  return carts[userId];
}

function cartResponse(cart) {
  const items = Array.from(cart.entries()).map(([bookId, quantity]) => ({ bookId, quantity }));
  const cartTotal = 0; // price lookup deferred to real DB implementation
  return { items, cartTotal };
}

router.post('/cart/items', (req, res) => {
  const userId = getUserId(req);
  const { bookId, quantity = 1 } = req.body;
  const cart = getCart(userId);
  cart.set(bookId, (cart.get(bookId) || 0) + quantity);
  res.json(cartResponse(cart));
});

router.put('/cart/items/:bookId', (req, res) => {
  const userId = getUserId(req);
  const { bookId } = req.params;
  const { quantity } = req.body;
  const cart = getCart(userId);
  cart.set(bookId, quantity);
  res.json(cartResponse(cart));
});

router.delete('/cart/items/:bookId', (req, res) => {
  const userId = getUserId(req);
  const { bookId } = req.params;
  const cart = getCart(userId);
  cart.delete(bookId);
  res.json(cartResponse(cart));
});

router.get('/cart', (req, res) => {
  const userId = getUserId(req);
  res.json(cartResponse(getCart(userId)));
});

module.exports = router;
