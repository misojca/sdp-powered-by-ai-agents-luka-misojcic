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
    // GIVEN the raw request body and stripe-signature header are available and STRIPE_WEBHOOK_SECRET is set
    const body = webhookPayload();

    // WHEN POST /payment/webhook receives a payment_intent.succeeded event
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(body);

    // THEN 200 OK is returned
    expect(res.status).toBe(200);
  });
});

describe('PAYMENT-BE-002.1-S2: POST /payment/webhook — invalid signature returns 400', () => {
  it('returns 400 with error message when stripe-signature header is missing', async () => {
    // GIVEN the stripe-signature header is absent

    // WHEN POST /payment/webhook is called without the signature header
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .send(webhookPayload());

    // THEN 400 Bad Request with invalid signature error
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });

  it('returns 400 when stripe-signature header is invalid', async () => {
    // GIVEN the stripe-signature header is tampered

    // WHEN POST /payment/webhook is called with a bad signature
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'bad-sig')
      .send(webhookPayload());

    // THEN 400 Bad Request with invalid signature error
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });
});

describe('PAYMENT-BE-002.1-S3: POST /payment/webhook — duplicate event is idempotent', () => {
  it('returns 200 on re-delivery of an already-processed event', async () => {
    // GIVEN the webhook for this stripeIntentId has already been processed
    const body = webhookPayload(STRIPE_INTENT_ID);

    // WHEN Stripe re-delivers the same payment_intent.succeeded event
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(body);

    // THEN 200 OK is returned (idempotent acknowledgement)
    expect(res.status).toBe(200);
  });
});
