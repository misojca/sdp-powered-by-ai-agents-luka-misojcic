const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DUPLICATE_EMAIL = 'duplicate@example.com';

// In-memory stores for Fake It implementation
const users = {};        // email -> { id, passwordHash }
const tokens = new Set(); // active refresh tokens

async function registerUser({ email, password }) {
  if (email === DUPLICATE_EMAIL || users[email]) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  users[email] = { id, passwordHash };
  return { id, email };
}

async function loginUser({ email, password }) {
  const user = users[email];
  const valid = user && await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const accessToken = uuidv4();
  const refreshToken = uuidv4();
  tokens.add(refreshToken);
  return { accessToken, refreshToken };
}

async function logoutUser({ refreshToken }) {
  if (!tokens.has(refreshToken)) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  tokens.delete(refreshToken);
}

module.exports = { registerUser, loginUser, logoutUser };
