const request = require('supertest');
const app = require('../../src/app');
const usersService = require('../../src/users/users.service');

jest.mock('../../src/users/users.service');

describe('USERS-BE-001.1-S3: POST /users/register — invalid body', () => {
  it('returns 400 and does not call service when email is missing', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ name: 'Alice', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(usersService.registerUser).not.toHaveBeenCalled();
  });

  it('returns 400 and does not call service when email format is invalid', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ name: 'Alice', email: 'not-an-email', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(usersService.registerUser).not.toHaveBeenCalled();
  });
});
