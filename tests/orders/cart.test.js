const request = require('supertest');
const app = require('../../src/app');

// A fixed bookId used across tests
const BOOK_ID = '00000000-0000-0000-0000-000000000001';

describe('ORDERS-BE-001.1-S1: POST /orders/cart/items — add item', () => {
  it('returns 200 with updated cart containing the added book', async () => {
    // WHEN POST /orders/cart/items is called with bookId and quantity
    const res = await request(app)
      .post('/orders/cart/items')
      .set('Authorization', 'Bearer testtoken')
      .send({ bookId: BOOK_ID, quantity: 1 });

    // THEN 200 with updated cart
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    const item = res.body.items.find(i => i.bookId === BOOK_ID);
    expect(item).toBeDefined();
    expect(item.quantity).toBe(1);
  });

  it('increments quantity when the same book is added again', async () => {
    // GIVEN the book is already in the cart (added in previous test)
    // WHEN POST /orders/cart/items is called again for the same book
    const res = await request(app)
      .post('/orders/cart/items')
      .set('Authorization', 'Bearer testtoken')
      .send({ bookId: BOOK_ID, quantity: 1 });

    expect(res.status).toBe(200);
    const item = res.body.items.find(i => i.bookId === BOOK_ID);
    expect(item.quantity).toBe(2);
  });
});

describe('ORDERS-BE-001.1-S2: PUT /orders/cart/items/:bookId — update quantity', () => {
  it('returns 200 with quantity updated to 3', async () => {
    // WHEN PUT /orders/cart/items/:bookId is called with { quantity: 3 }
    const res = await request(app)
      .put(`/orders/cart/items/${BOOK_ID}`)
      .set('Authorization', 'Bearer testtoken')
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    const item = res.body.items.find(i => i.bookId === BOOK_ID);
    expect(item.quantity).toBe(3);
  });
});

describe('ORDERS-BE-001.1-S3: DELETE /orders/cart/items/:bookId — remove item', () => {
  it('returns 200 with the item no longer present in the cart', async () => {
    // WHEN DELETE /orders/cart/items/:bookId is called
    const res = await request(app)
      .delete(`/orders/cart/items/${BOOK_ID}`)
      .set('Authorization', 'Bearer testtoken');

    expect(res.status).toBe(200);
    const item = res.body.items.find(i => i.bookId === BOOK_ID);
    expect(item).toBeUndefined();
  });
});

describe('ORDERS-BE-001.1-S4: GET /orders/cart — get cart', () => {
  it('returns 200 with items array and cartTotal', async () => {
    // WHEN GET /orders/cart is called
    const res = await request(app)
      .get('/orders/cart')
      .set('Authorization', 'Bearer testtoken');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('cartTotal');
  });
});
