# 3. System Scope and Context

## 3.1 System Scope

The Online Bookstore system encompasses:
- A React single-page application (SPA) served to customers and admins
- A Node.js/Express API handling all business logic
- A PostgreSQL database for persistent storage
- A Redis instance for caching and async job queuing

The following are **out of scope** (handled by external systems):
- Card payment processing (Stripe)
- Email delivery (SendGrid)
- DNS, CDN, and TLS termination (AWS infrastructure)

## 3.2 Context Diagram

See [`diagrams/03-system-context.puml`](diagrams/03-system-context.puml).

## 3.3 External Interfaces

| External System | Direction | Protocol | Purpose |
|----------------|-----------|----------|---------|
| Stripe | Outbound + Webhook inbound | HTTPS / REST | Payment initiation and confirmation |
| SendGrid | Outbound | HTTPS / REST | Transactional email delivery |
| AWS S3 | Outbound | HTTPS | Book cover image storage |

## 3.4 Users

| Actor | Description |
|-------|-------------|
| Customer | Browses catalog, manages cart, places orders, receives emails |
| Store Admin | Manages book inventory, views and updates orders |
