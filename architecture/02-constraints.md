# 2. Architecture Constraints

## 2.1 Technical Constraints

| ID | Constraint | Rationale |
|----|-----------|-----------|
| TC-01 | Frontend must be React | Mandated by tech stack |
| TC-02 | API must be Node.js + Express | Mandated by tech stack |
| TC-03 | Primary datastore must be PostgreSQL | Mandated by tech stack |
| TC-04 | Caching and async queuing must use Redis | Mandated by tech stack |
| TC-05 | Payment processing exclusively via Stripe | No card data may be stored or transmitted through our systems |
| TC-06 | Transactional email exclusively via SendGrid | Mandated by tech stack |
| TC-07 | Deployment target is AWS | Mandated by tech stack; mix of serverless and containerized services |
| TC-08 | All architecture diagrams are `.puml` files committed to the repo | Diagrams as code principle |

## 2.2 Organizational Constraints

| ID | Constraint | Rationale |
|----|-----------|-----------|
| OC-01 | Each bounded context owns its own PostgreSQL schema | Enforces module isolation; no cross-context DB joins |
| OC-02 | Inter-context communication via service interfaces only | No direct table access across context boundaries |
| OC-03 | All write operations require authentication | Security baseline |
| OC-04 | Input validation at the API boundary | Fail-fast; invalid state must never reach the database |

## 2.3 Regulatory / Compliance Constraints

| ID | Constraint | Rationale |
|----|-----------|-----------|
| RC-01 | PCI-DSS scope minimized by delegating all card handling to Stripe | Stripe is PCI-DSS Level 1 certified |
| RC-02 | Personally identifiable information (PII) must not appear in logs | GDPR / data privacy baseline |
| RC-03 | Passwords must be hashed (bcrypt, min cost 12) | Security best practice; never stored in plaintext |
