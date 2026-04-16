# 9. Architecture Decisions

## ADR-001: Modular Monolith over Microservices

**Status:** Accepted

**Context:**
The system has five bounded contexts. Microservices would add significant operational overhead (service discovery, distributed tracing, inter-service networking) for a team likely starting small.

**Decision:**
Deploy as a single Express application with strict internal module boundaries.

**Rationale:**
- Lower operational complexity at launch
- Context boundaries are enforced by code structure, enabling future extraction
- Single deployment unit simplifies CI/CD and local development

**Consequences:**
- All contexts share one process; a crash affects all contexts
- Scaling is coarse-grained (entire API scales, not individual contexts)

---

## ADR-002: PostgreSQL as Primary Datastore

**Status:** Accepted

**Context:**
The system requires ACID transactions (stock decrement + order creation must be atomic) and relational queries (catalog search, order history).

**Decision:**
Use PostgreSQL with one schema per bounded context.

**Rationale:**
- ACID guarantees prevent overselling
- Schema-per-context enforces isolation without separate databases
- Mature tooling and AWS RDS support

**Consequences:**
- Cross-context queries require service-layer joins, not SQL joins
- Single DB is a potential bottleneck at very high scale

---

## ADR-003: Redis for Caching and Job Queue

**Status:** Accepted

**Context:**
Catalog reads are high-frequency and mostly static. Email delivery must not block the order request/response cycle.

**Decision:**
Use Redis for catalog response caching (TTL-based) and as a Bull job queue for async email dispatch.

**Rationale:**
- Single Redis instance serves two purposes, reducing infrastructure components
- Bull is a mature Node.js queue library built on Redis
- Cache TTL of 5 minutes is acceptable for catalog data

**Consequences:**
- Redis becomes a dependency for both read performance and async processing
- Cache invalidation must be triggered on catalog writes

---

## ADR-004: Stripe Payment Intents for Payment Processing

**Status:** Accepted

**Context:**
Handling card data directly requires PCI-DSS compliance, which is costly and complex.

**Decision:**
Use Stripe Payment Intents. Card data is entered directly into Stripe's hosted fields on the client side; our API only handles `client_secret` and webhook events.

**Rationale:**
- Card data never touches our systems; PCI-DSS scope minimized
- Stripe webhooks provide reliable async payment confirmation
- Stripe signature verification prevents spoofed webhook events

**Consequences:**
- Payment flow depends on Stripe availability
- Webhook endpoint must be publicly reachable and idempotent

---

## ADR-005: JWT Authentication with Redis-backed Refresh Tokens

**Status:** Accepted

**Context:**
Stateless JWTs cannot be revoked before expiry. Short-lived tokens alone create poor UX (frequent re-login).

**Decision:**
Issue short-lived JWTs (15 min) paired with refresh tokens stored in Redis (7 days). Logout deletes the Redis key, effectively revoking the session.

**Rationale:**
- Stateless access tokens keep per-request auth fast (no DB lookup)
- Redis-backed refresh tokens enable server-side revocation
- Compromise window limited to 15 minutes for stolen access tokens

**Consequences:**
- Redis is required for auth; its unavailability prevents token refresh
- Refresh token rotation must be implemented to prevent reuse attacks
