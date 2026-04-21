const request = require('supertest');
const app = require('../../src/app');

describe('USERS-BE-001.1-S3: POST /users/register — invalid body', () => {
  it('returns 400 when email is missing', async () => {
    // GIVEN a request body with no email field

    // WHEN POST /users/register is called
    const res = await request(app)
      .post('/users/register')
      .send({ name: 'Alice', password: 'secret123' });

    // THEN 400 is returned
    expect(res.status).toBe(400);
  });

  it('returns 400 when email format is invalid', async () => {
    // GIVEN a request body with a malformed email

    // WHEN POST /users/register is called
    const res = await request(app)
      .post('/users/register')
      .send({ name: 'Alice', email: 'not-an-email', password: 'secret123' });

    // THEN 400 is returned
    expect(res.status).toBe(400);
  });
});
