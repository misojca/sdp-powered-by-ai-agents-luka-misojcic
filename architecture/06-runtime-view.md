# 6. Runtime View

Three key scenarios are documented as sequence diagrams.

| Scenario | Diagram |
|----------|---------|
| Customer places an order | [`diagrams/06-seq-place-order.puml`](diagrams/06-seq-place-order.puml) |
| Stripe webhook confirms payment | [`diagrams/06-seq-payment-webhook.puml`](diagrams/06-seq-payment-webhook.puml) |
| Customer searches the catalog | [`diagrams/06-seq-catalog-search.puml`](diagrams/06-seq-catalog-search.puml) |

## 6.1 Place Order

1. Customer submits cart checkout via React SPA.
2. Auth Middleware validates JWT.
3. Orders Service opens a DB transaction, locks stock rows (`SELECT FOR UPDATE`), decrements stock, and creates the order in `PENDING` state.
4. Orders Service calls Notifications Service to enqueue an "order received" email job.
5. Orders Service calls Payment Service to create a Stripe Payment Intent.
6. Stripe returns a `client_secret`; API returns it to the SPA.
7. SPA completes payment on the client side directly with Stripe.

## 6.2 Payment Webhook

1. Stripe sends `payment_intent.succeeded` webhook to `POST /payment/webhook`.
2. Payment Service verifies the Stripe signature.
3. Payment Service calls Orders Service to transition order from `PENDING` → `CONFIRMED`.
4. Orders Service calls Notifications Service to enqueue an "order confirmed" email job.
5. Notification Worker picks up the job and calls SendGrid.

## 6.3 Catalog Search

1. Customer submits a search query via the SPA.
2. Catalog Service checks Redis for a cached result.
3. **Cache hit:** returns cached result immediately.
4. **Cache miss:** queries PostgreSQL, stores result in Redis with a TTL, returns result.
