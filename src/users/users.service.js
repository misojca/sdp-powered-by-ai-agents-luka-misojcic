const DUPLICATE_EMAIL = 'duplicate@example.com';

async function registerUser({ email }) {
  if (email === DUPLICATE_EMAIL) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }
  return { id: 'fake-uuid', email };
}

module.exports = { registerUser };
