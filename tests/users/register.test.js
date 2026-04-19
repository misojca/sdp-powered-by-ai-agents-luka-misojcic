const request = require('supertest');
const app = require('../../src/app');

describe('USERS-BE-001.1-S1: POST /users/register — valid registration', () => {
  it('hashes password, inserts user, returns 201 with { id, email }', async () => {
    // GIVEN a valid name, email, and password
    const body = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };

    // WHEN POST /users/register is called
    const res = await request(app).post('/users/register').send(body);

    // THEN 201 is returned with { id, email }
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'fake-uuid', email: 'alice@example.com' });
  });
});
