const request = require('supertest');
const app = require('../../src/app');

describe('USERS-BE-001.1-S2: POST /users/register — duplicate email', () => {
  it('returns 409 with { error: "Email already in use" } when email is taken', async () => {
    // GIVEN an email that is already registered
    const body = { name: 'Alice', email: 'duplicate@example.com', password: 'secret123' };

    // WHEN POST /users/register is called with that email
    const res = await request(app).post('/users/register').send(body);

    // THEN 409 is returned with the duplicate-email error message
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Email already in use' });
  });
});
