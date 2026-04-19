const request = require('supertest');
const app = require('../../src/app');

describe('CATALOG-BE-001.1-S1: GET /catalog/books — full-text search returns paginated results', () => {
  it('returns 200 with { items, total, page, limit }', async () => {
    // WHEN GET /catalog/books?q=tolkien&page=1&limit=20 is called
    const res = await request(app)
      .get('/catalog/books')
      .query({ q: 'tolkien', page: 1, limit: 20 });

    // THEN 200 with paginated structure
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      limit: 20,
    });
  });

  it('returns empty items array when no books match', async () => {
    // WHEN searching for a term that matches nothing
    const res = await request(app)
      .get('/catalog/books')
      .query({ q: 'zzznomatch', page: 1, limit: 20 });

    // THEN 200 with empty items and total 0
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });
});

describe('CATALOG-BE-001.1-S3: GET /catalog/books — category filter narrows results', () => {
  it('returns 200 with paginated structure when filtering by category', async () => {
    // WHEN GET /catalog/books?category=fantasy&page=1&limit=20 is called
    const res = await request(app)
      .get('/catalog/books')
      .query({ category: 'fantasy', page: 1, limit: 20 });

    // THEN 200 with standard paginated format
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      limit: 20,
    });
  });
});
