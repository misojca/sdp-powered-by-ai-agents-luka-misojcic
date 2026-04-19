const request = require('supertest');
const app = require('../../src/app');
const usersService = require('../../src/users/users.service');

jest.mock('../../src/users/users.service');

describe('USERS-BE-001.1-S2: POST /users/register — duplicate email', () => {
  it('returns 409 with { error: "Email already in use" } when email is taken', async () => {
    const err = new Error('Email already in use');
    err.status = 409;
    usersService.registerUser.mockRejectedValue(err);

    const res = await request(app)
      .post('/users/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Email already in use' });
  });
});
