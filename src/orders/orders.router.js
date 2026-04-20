const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// In-memory cart store: userId -> Map<bookId, quantity>
const carts = {};

// In-memory stock: default 100 per book; any book not seen gets 100
const stock = {};
function getStock(bookId) {
  if (stock[bookId] === undefined) stock[bookId] = 100;
  return stock[bookId];
}

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

router.post('/', (req, res) => {
  const userId = getUserId(req);
  const cart = getCart(userId);

  if (cart.size === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Check stock for all items
  for (const [bookId, quantity] of cart.entries()) {
    if (getStock(bookId) < quantity) {
      return res.status(409).json({ error: 'Insufficient stock', bookId });
    }
  }

  // Decrement stock and build order
  const items = [];
  let total = 0;
  for (const [bookId, quantity] of cart.entries()) {
    stock[bookId] = getStock(bookId) - quantity;
    items.push({ bookId, quantity, unitPrice: 0 });
  }

  // Clear cart
  cart.clear();

  res.status(201).json({ orderId: uuidv4(), status: 'PENDING', items, total });
});

module.exports = router;
