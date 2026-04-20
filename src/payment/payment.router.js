const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');

const router = Router();

function getUserId(req) {
  const auth = req.headers.authorization || '';
  return auth.replace('Bearer ', '') || 'anonymous';
}

// Seeded orders: orderId -> { userId, status }
const orders = {
  '00000000-0000-0000-0000-000000000010': { userId: 'payment-user', status: 'PENDING' },
  '00000000-0000-0000-0000-000000000011': { userId: 'other-user',   status: 'PENDING' },
  '00000000-0000-0000-0000-000000000012': { userId: 'payment-user', status: 'CONFIRMED' },
};

// Idempotency store: orderId -> clientSecret
const intents = {};

router.post('/intents', (req, res) => {
  const userId = getUserId(req);
  const { orderId } = req.body;

  const order = orders[orderId];
  if (!order || order.userId !== userId) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'PENDING') return res.status(409).json({ error: 'Order is not awaiting payment' });

  if (!intents[orderId]) intents[orderId] = `pi_${uuidv4()}_secret_${uuidv4()}`;

  res.status(201).json({ clientSecret: intents[orderId] });
});

module.exports = router;
