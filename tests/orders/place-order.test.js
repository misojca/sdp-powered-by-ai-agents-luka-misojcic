const request = require('supertest');
const app = require('../../src/app');

const BOOK_ID = '00000000-0000-0000-0000-000000000002';

async function addToCart(bookId = BOOK_ID, quantity = 1) {
  return request(app)
    .post('/orders/cart/items')
    .set('Authorization', 'Bearer placeorder-user')
    .send({ bookId, quantity });
}

describe('ORDERS-BE-002.1-S1: POST /orders — places order from cart', () => {
  it('returns 201 with orderId, status PENDING, items, and total', async () => {
    // GIVEN a non-empty cart
    await addToCart();

    // WHEN POST /orders is called
    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer placeorder-user');

    // THEN 201 with order summary
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      orderId: expect.any(String),
      status: 'PENDING',
      items: expect.any(Array),
      total: expect.any(Number),
    });
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('clears the cart after placing the order', async () => {
    // Cart was cleared by the previous test's POST /orders
    const cartRes = await request(app)
      .get('/orders/cart')
      .set('Authorization', 'Bearer placeorder-user');

    expect(cartRes.body.items).toHaveLength(0);
  });
});

describe('ORDERS-STORY-002-S3: POST /orders — empty cart returns 400', () => {
  it('returns 400 with { error: "Cart is empty" } when cart has no items', async () => {
    // GIVEN an empty cart (different user token)
    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer empty-cart-user');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Cart is empty' });
  });
});

describe('ORDERS-STORY-002-S2: POST /orders — insufficient stock returns 409', () => {
  it('returns 409 with { error: "Insufficient stock", bookId } when stock is too low', async () => {
    // GIVEN a cart with a book that has no stock (quantity exceeds available)
    const OUT_OF_STOCK_BOOK_ID = '00000000-0000-0000-0000-000000000099';
    await request(app)
      .post('/orders/cart/items')
      .set('Authorization', 'Bearer stock-user')
      .send({ bookId: OUT_OF_STOCK_BOOK_ID, quantity: 9999 });

    // WHEN POST /orders is called
    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer stock-user');

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: 'Insufficient stock', bookId: OUT_OF_STOCK_BOOK_ID });
  });
});
