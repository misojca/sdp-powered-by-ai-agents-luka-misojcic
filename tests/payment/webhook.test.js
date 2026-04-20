const request = require('supertest');
const app = require('../../src/app');

const STRIPE_INTENT_ID = 'pi_test_webhook_001';
const ORDER_ID = '00000000-0000-0000-0000-000000000020';

function webhookPayload(stripeIntentId = STRIPE_INTENT_ID) {
  return JSON.stringify({
    type: 'payment_intent.succeeded',
    data: { object: { id: stripeIntentId, metadata: { orderId: ORDER_ID } } },
  });
}

describe('PAYMENT-BE-002.1-S1: POST /payment/webhook — valid event processes successfully', () => {
  it('returns 200 when stripe-signature header is present and event is valid', async () => {
    const body = webhookPayload();

    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(body);

    expect(res.status).toBe(200);
  });
});

describe('PAYMENT-BE-002.1-S2: POST /payment/webhook — invalid signature returns 400', () => {
  it('returns 400 with error message when stripe-signature header is missing', async () => {
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .send(webhookPayload());

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });

  it('returns 400 when stripe-signature header is invalid', async () => {
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'bad-sig')
      .send(webhookPayload());

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });
});

describe('PAYMENT-BE-002.1-S3: POST /payment/webhook — duplicate event is idempotent', () => {
  it('returns 200 on re-delivery of an already-processed event', async () => {
    const body = webhookPayload(STRIPE_INTENT_ID);

    // First delivery (already processed in S1 test)
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(body);

    expect(res.status).toBe(200);
  });
});
