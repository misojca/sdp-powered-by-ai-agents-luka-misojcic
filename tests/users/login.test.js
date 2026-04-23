const request = require('supertest');
const app = require('../../src/app');

describe('USERS-BE-002.1-S1: POST /users/login — valid credentials return tokens', () => {
  it('returns 200 with { accessToken, refreshToken }', async () => {
    // GIVEN a registered user
    await request(app).post('/users/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'secret123',
    });

    // WHEN POST /users/login is called with correct credentials
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'bob@example.com', password: 'secret123' });

    // THEN 200 with both tokens
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });
});

describe('USERS-BE-002.1-S2: POST /users/login — invalid credentials return 401', () => {
  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'bob@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  it('returns 401 for unknown email (same response — no user enumeration)', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'nobody@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });
});

describe('USERS-BE-002.1-S3: POST /users/logout — deletes refresh token', () => {
  it('returns 204 and subsequent use of the token returns 401', async () => {
    // GIVEN a logged-in user with a refresh token
    const loginRes = await request(app)
      .post('/users/login')
      .send({ email: 'bob@example.com', password: 'secret123' });
    const { refreshToken } = loginRes.body;

    // WHEN POST /users/logout is called
    const logoutRes = await request(app)
      .post('/users/logout')
      .send({ refreshToken });

    // THEN 204 No Content
    expect(logoutRes.status).toBe(204);

    // AND subsequent use of that refresh token returns 401
    const reuse = await request(app)
      .post('/users/logout')
      .send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});
