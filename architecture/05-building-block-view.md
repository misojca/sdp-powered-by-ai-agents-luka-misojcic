# 5. Building Block View

## 5.1 Level 1 — Container View

See [`diagrams/05-containers.puml`](diagrams/05-containers.puml).

| Container | Technology | Responsibility |
|-----------|-----------|---------------|
| React SPA | React | Customer and admin UI; communicates with API over HTTPS |
| API Server | Node.js + Express | All business logic; hosts all bounded context routers |
| PostgreSQL | PostgreSQL | Persistent storage; one schema per bounded context |
| Redis | Redis | Catalog cache + Bull job queue for async notifications |
| Notification Worker | Node.js (Bull worker) | Consumes email jobs from Redis queue; calls SendGrid |

## 5.2 Level 2 — Component View (API Server)

See [`diagrams/05-components-api.puml`](diagrams/05-components-api.puml).

| Component | Bounded Context | Responsibility |
|-----------|----------------|---------------|
| Users Router + Service | Users | Registration, login, JWT issuance, profile |
| Catalog Router + Service | Catalog | Book CRUD, search, stock queries; Redis cache |
| Orders Router + Service | Orders | Cart management, order placement, lifecycle updates |
| Payment Router + Service | Payment | Stripe Payment Intent creation, webhook handling |
| Notifications Service | Notifications | Enqueues email jobs onto Redis Bull queue |
| Auth Middleware | Shared | JWT validation on protected routes |
| Error Handler | Shared | Centralised error formatting and logging |
| DB Client | Shared | Single pg connection pool shared across repositories |
