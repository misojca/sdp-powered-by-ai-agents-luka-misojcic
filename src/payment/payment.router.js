const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const express = require('express');

const router = Router();

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'valid-sig';

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

// Processed webhook intents: stripeIntentId -> status
const processedIntents = {};

router.post('/intents', (req, res) => {
  const userId = getUserId(req);
  const { orderId } = req.body;

  const order = orders[orderId];
  if (!order || order.userId !== userId) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'PENDING') return res.status(409).json({ error: 'Order is not awaiting payment' });

  if (!intents[orderId]) intents[orderId] = `pi_${uuidv4()}_secret_${uuidv4()}`;

  res.status(201).json({ clientSecret: intents[orderId] });
});

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || sig !== WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
    ? JSON.parse(req.body)
    : req.body;
  if (event.type !== 'payment_intent.succeeded') return res.status(200).end();

  const stripeIntentId = event.data.object.id;
  const { orderId } = event.data.object.metadata;

  // Idempotency: already processed
  if (processedIntents[stripeIntentId] === 'SUCCEEDED') return res.status(200).end();

  processedIntents[stripeIntentId] = 'SUCCEEDED';
  if (orders[orderId]) orders[orderId].status = 'CONFIRMED';

  res.status(200).end();
});

module.exports = router;
