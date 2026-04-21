# 12. Glossary

| Term | Definition |
|------|-----------|
| **Bounded Context** | A module with a clearly defined responsibility and its own data schema; no direct data access from other contexts |
| **Bull** | A Redis-backed job queue library for Node.js used to process async tasks (email dispatch) |
| **Cart** | A transient collection of books a customer intends to purchase; lives in the Orders context |
| **Dead-letter Queue** | A queue where jobs are moved after exhausting all retry attempts, preventing silent failure |
| **ECS Fargate** | AWS serverless container runtime; runs Docker containers without managing EC2 instances |
| **ElastiCache** | AWS managed Redis service used for caching and the Bull job queue |
| **Idempotency Key** | A unique identifier attached to an operation so that duplicate requests produce the same result without side effects |
| **JWT (JSON Web Token)** | A signed, short-lived token used to authenticate API requests; contains `userId` and `role` claims |
| **Modular Monolith** | A single deployable application internally structured into isolated modules with clear boundaries |
| **node-pg-migrate** | A PostgreSQL migration library for Node.js; manages schema versioning per bounded context |
| **Order** | A confirmed intent to purchase one or more books; transitions through states: `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` |
| **Payment Intent** | A Stripe object representing a payment lifecycle; the `client_secret` is returned to the frontend to complete card entry |
| **PCI-DSS** | Payment Card Industry Data Security Standard; compliance requirement for systems handling card data |
| **pino** | A fast, structured JSON logger for Node.js |
| **Pre-signed URL** | A time-limited AWS S3 URL granting temporary access to a private object (used for book cover images) |
| **Refresh Token** | A long-lived token stored in Redis used to issue new access JWTs without re-authentication |
| **RDS** | AWS Relational Database Service; managed PostgreSQL with automated backups and Multi-AZ failover |
| **SELECT FOR UPDATE** | A PostgreSQL row-level lock that prevents concurrent transactions from modifying the same row simultaneously |
| **SendGrid** | Third-party email delivery service used for transactional emails (order confirmation, shipping notification) |
| **Stripe** | Third-party payment processor; handles all card data, keeping the system outside PCI-DSS scope |
| **TTL (Time To Live)** | Expiry duration set on a Redis cache entry; catalog entries use a 5-minute TTL |
| **Webhook** | An HTTP callback sent by an external system (Stripe) to notify of an event (payment succeeded) |
| **zod** | A TypeScript-first schema validation library used at the API boundary to validate request inputs |
