# 11. Risks and Technical Debts

## 11.1 Risks

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|-----------|
| R-01 | Redis unavailability blocks auth (refresh) and email queue | Medium | High | ElastiCache Multi-AZ; Bull retries with backoff; access tokens remain valid for 15min during outage |
| R-02 | Stripe API outage prevents order completion | Low | High | Surface clear error to user; order stays `PENDING`; customer can retry; no stock held permanently |
| R-03 | Modular monolith becomes a big ball of mud as team grows | Medium | Medium | Enforce context boundaries via linting rules and code review; ADR-001 documents extraction path |
| R-04 | PostgreSQL single point of failure in production | Low | High | RDS Multi-AZ with automatic failover |
| R-05 | Webhook replay attacks (duplicate order confirmation) | Medium | Medium | Idempotency key per Payment Intent stored in `payment` schema; duplicate webhooks ignored |

## 11.2 Technical Debts

| ID | Debt | Impact | Remediation |
|----|------|--------|-------------|
| TD-01 | No distributed tracing (e.g. OpenTelemetry) | Hard to diagnose latency across contexts | Add OpenTelemetry instrumentation; export to AWS X-Ray |
| TD-02 | Cache invalidation is manual (delete on write) | Stale catalog data possible if invalidation is missed | Introduce a cache invalidation service or event-driven invalidation |
| TD-03 | No rate limiting on public endpoints | Catalog and auth endpoints vulnerable to abuse | Add `express-rate-limit` behind ALB |
| TD-04 | Bull queue has no dead-letter handling | Failed email jobs silently dropped after max retries | Configure Bull dead-letter queue; alert on failures |
| TD-05 | No API versioning strategy | Breaking changes require coordinated frontend deploys | Adopt URL versioning (`/v1/`) from the start |
