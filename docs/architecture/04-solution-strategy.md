# 4. Solution Strategy

## 4.1 Architectural Approach

The system is built as a **modular monolith** — a single deployable Express API internally structured around bounded contexts. Each context is an independent router + service + repository module with its own PostgreSQL schema. This keeps deployment simple while preserving the option to extract contexts into microservices later.

## 4.2 Key Strategic Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture style | Modular monolith | Low operational overhead; clear context boundaries enable future extraction |
| Inter-context communication | In-process service calls via defined interfaces | No network overhead; boundaries enforced by code structure, not infrastructure |
| Async processing | Redis queue (Bull) | Decouples email notifications from the order request/response cycle |
| Caching | Redis | Reduces PostgreSQL load for high-read catalog data |
| Stock consistency | PostgreSQL row-level locking (`SELECT FOR UPDATE`) | Prevents overselling under concurrent order placement |
| Payment | Stripe Checkout / Payment Intents | Keeps card data off our systems; PCI-DSS scope minimized |
| Authentication | JWT (short-lived access token + refresh token) | Stateless auth; refresh tokens stored in Redis for revocation |
| Image storage | AWS S3 | Offloads binary storage; pre-signed URLs served directly to the client |

## 4.3 How Quality Goals Are Addressed

| Quality Goal | Strategy |
|-------------|----------|
| Security | JWT auth on all writes; Stripe handles card data; bcrypt passwords; no PII in logs |
| Data Consistency | DB transactions + `SELECT FOR UPDATE` for stock decrement |
| Availability | Async email via Redis queue; Stripe webhooks for payment confirmation |
| Performance | Redis cache for catalog; paginated search queries with DB indexes |
| Maintainability | One Express router per bounded context; no cross-schema DB joins |

## 4.4 Decomposition Strategy

```
src/
  catalog/      # router, service, repository — owns `catalog` schema
  orders/       # router, service, repository — owns `orders` schema
  payment/      # router, service, repository — owns `payment` schema
  users/        # router, service, repository — owns `users` schema
  notifications/# worker (Bull) + SendGrid client — no HTTP router
  shared/       # auth middleware, error handler, logger, DB client
```
