# 8. Cross-cutting Concepts

## 8.1 Authentication & Authorization

- All write endpoints and user-specific read endpoints require a valid JWT in the `Authorization: Bearer <token>` header.
- JWTs are short-lived (15 min access token). Refresh tokens (7 days) are stored in Redis; revocation is done by deleting the Redis key.
- The `Auth Middleware` in `src/shared/auth.js` validates the token and attaches `req.user` before the request reaches any router.
- Admin-only routes are guarded by a second `requireRole('admin')` middleware.

```js
// src/shared/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 8.2 Error Handling

- All errors are caught by a single Express error-handling middleware registered last in `src/app.js`.
- Operational errors (validation, not found, conflict) return structured JSON with an HTTP status code.
- Unexpected errors are logged and return a generic `500` — no stack traces exposed to clients.

```js
// src/shared/errorHandler.js
module.exports = (err, req, res, next) => {
  const status = err.status ?? 500;
  if (status === 500) logger.error(err);
  res.status(status).json({ error: err.message ?? 'Internal server error' });
};
```

## 8.3 Logging

- Structured JSON logging via `pino`.
- Every request is logged with `method`, `path`, `statusCode`, and `responseTimeMs`.
- PII (email, name) is never logged — redacted at the logger level.
- Log levels: `debug` (dev), `info` (staging/prod), `error` for unhandled exceptions.

```js
// src/shared/logger.js
const pino = require('pino');
module.exports = pino({ level: process.env.LOG_LEVEL ?? 'info' });
```

## 8.4 Input Validation

- All request bodies and query params are validated at the router level using `zod` schemas before reaching the service layer.
- Invalid input returns `400` immediately — nothing invalid reaches the DB.

```js
const { z } = require('zod');
const schema = z.object({ title: z.string().min(1), price: z.number().positive() });

router.post('/books', auth, (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  next();
});
```

## 8.5 Configuration & Secrets

- All secrets (DB URL, JWT secret, Stripe key, SendGrid key) are injected as environment variables.
- In production, values are sourced from AWS Secrets Manager at container startup.
- No secrets are committed to the repository.

## 8.6 Database Migrations

- Schema migrations managed by `node-pg-migrate`.
- Migrations run automatically on container startup in a pre-start script.
- Each bounded context has its own migration directory: `migrations/catalog/`, `migrations/orders/`, etc.
