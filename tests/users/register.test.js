const request = require('supertest');
const app = require('../../src/app');
const usersService = require('../../src/users/users.service');

jest.mock('../../src/users/users.service');

describe('USERS-BE-001.1-S1: POST /users/register — valid registration', () => {
  it('hashes password, inserts user, returns 201 with { id, email }', async () => {
    const body = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };
    usersService.registerUser.mockResolvedValue({ id: 'uuid-abc', email: body.email });

    const res = await request(app).post('/users/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'uuid-abc', email: 'alice@example.com' });
    expect(usersService.registerUser).toHaveBeenCalledWith(body);
  });
});
