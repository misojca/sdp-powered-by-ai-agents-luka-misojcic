# 10. Quality Requirements

## 10.1 Quality Tree

```
Quality
├── Security
│   ├── No card data stored (Stripe)
│   ├── Passwords hashed (bcrypt)
│   └── JWT auth on all write operations
├── Reliability
│   ├── No overselling (SELECT FOR UPDATE)
│   └── Async email (order flow not blocked by SendGrid)
├── Performance
│   ├── Catalog search < 500ms p95
│   └── Redis cache for hot catalog data
├── Availability
│   └── Uptime ≥ 99.5%
└── Maintainability
    ├── One router per bounded context
    └── No cross-schema SQL joins
```

## 10.2 Quality Scenarios

| ID | Quality Attribute | Stimulus | Response | Measure |
|----|------------------|----------|----------|---------|
| QS-01 | Performance | 100 concurrent catalog searches | Results returned from Redis cache | p95 < 500ms |
| QS-02 | Data Consistency | Two customers buy the last copy simultaneously | Only one order succeeds; stock never goes negative | Zero oversell incidents |
| QS-03 | Security | Request with expired JWT reaches a write endpoint | Request rejected before reaching service layer | HTTP 401; no DB write |
| QS-04 | Security | Stripe webhook received without valid signature | Request rejected by Payment Service | HTTP 400; no state change |
| QS-05 | Availability | SendGrid is unavailable during order placement | Order is placed successfully; email retried via Bull queue | Zero failed orders due to email outage |
| QS-06 | Availability | Single ECS task crashes | ALB routes traffic to remaining tasks within 30s | Uptime ≥ 99.5% |
| QS-07 | Maintainability | New bounded context added | New router/service/repository added without modifying existing modules | Zero changes to existing context code |
