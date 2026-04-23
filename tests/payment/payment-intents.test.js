const request = require('supertest');
const app = require('../../src/app');

const ORDER_ID = '00000000-0000-0000-0000-000000000010';
const OTHER_USER_ORDER_ID = '00000000-0000-0000-0000-000000000011';

describe('PAYMENT-BE-001.1-S1: POST /payment/intents — creates Payment Intent', () => {
  it('returns 201 with clientSecret for a PENDING order', async () => {
    const res = await request(app)
      .post('/payment/intents')
      .set('Authorization', 'Bearer payment-user')
      .send({ orderId: ORDER_ID });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('clientSecret');
    expect(typeof res.body.clientSecret).toBe('string');
    expect(res.body.clientSecret.length).toBeGreaterThan(0);
  });
});

describe('PAYMENT-BE-001.1-S2: POST /payment/intents — duplicate returns existing clientSecret', () => {
  it('returns the same clientSecret on a second request for the same order', async () => {
    // GIVEN a Payment Intent already exists for ORDER_ID (created in S1 test above)
    const res = await request(app)
      .post('/payment/intents')
      .set('Authorization', 'Bearer payment-user')
      .send({ orderId: ORDER_ID });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('clientSecret');

    // AND a third call also returns the same secret
    const res2 = await request(app)
      .post('/payment/intents')
      .set('Authorization', 'Bearer payment-user')
      .send({ orderId: ORDER_ID });

    expect(res2.body.clientSecret).toBe(res.body.clientSecret);
  });
});

describe('PAYMENT-STORY-001-S2: POST /payment/intents — order not found returns 404', () => {
  it('returns 404 for an order that does not belong to the user', async () => {
    const res = await request(app)
      .post('/payment/intents')
      .set('Authorization', 'Bearer payment-user')
      .send({ orderId: OTHER_USER_ORDER_ID });

    expect(res.status).toBe(404);
  });
});

describe('PAYMENT-STORY-001-S3: POST /payment/intents — non-PENDING order returns 409', () => {
  it('returns 409 with error message for a non-PENDING order', async () => {
    const CONFIRMED_ORDER_ID = '00000000-0000-0000-0000-000000000012';

    const res = await request(app)
      .post('/payment/intents')
      .set('Authorization', 'Bearer payment-user')
      .send({ orderId: CONFIRMED_ORDER_ID });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Order is not awaiting payment' });
  });
});
