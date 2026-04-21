# Payment Domain — Story Bundles

---

## PAYMENT-STORY-001: Initiate Stripe Payment

**Architecture Reference**: Section 1 — Introduction and Goals (G-04)
**Priority**: CORE
**Pareto**: 20% core (delivers 80% value)

AS A logged-in customer
I WANT to initiate payment for my placed order via Stripe
SO THAT I can complete my purchase securely without my card data touching the bookstore's systems

### SCENARIO 1: Payment Intent created successfully

**Scenario ID**: PAYMENT-STORY-001-S1

**GIVEN**
* The customer has a `PENDING` order
* The customer is authenticated

**WHEN**
* The customer proceeds to the payment page for that order

**THEN**
* The API creates a Stripe Payment Intent for the order total
* A `client_secret` is returned to the SPA
* A `payment.payment_intents` record is created with `status = 'CREATED'`
* The customer's card data never reaches the bookstore API

### SCENARIO 2: Order not found or not owned by customer

**Scenario ID**: PAYMENT-STORY-001-S2

**GIVEN**
* The order ID does not exist or belongs to a different user

**WHEN**
* The customer requests a Payment Intent for that order ID

**THEN**
* Response is `404 Not Found`
* No Stripe API call is made

### SCENARIO 3: Order not in PENDING state

**Scenario ID**: PAYMENT-STORY-001-S3

**GIVEN**
* The order exists but has status `CONFIRMED` or `SHIPPED`

**WHEN**
* The customer requests a Payment Intent for that order

**THEN**
* Response is `409 Conflict` with `{ error: "Order is not awaiting payment" }`
* No Stripe API call is made

---

### PAYMENT-FE-001.1: Payment Page with Stripe Elements

**Architecture Reference**: Section 6 — Runtime View (6.1 Place Order)

AS A logged-in customer
I WANT a payment page that loads Stripe Elements using the `client_secret`
SO THAT I can enter my card details directly in Stripe's hosted UI without exposing them to the bookstore

#### SCENARIO 1: Payment page loads Stripe Elements

**Scenario ID**: PAYMENT-FE-001.1-S1

**GIVEN**
* The customer has been redirected to `/payment/:orderId`

**WHEN**
* The page loads

**THEN**
* A `POST /payment/intents` request is made with `{ orderId }`
* The returned `client_secret` is used to initialise Stripe Elements
* The card input field is rendered inside a Stripe-hosted iframe

#### SCENARIO 2: Customer submits card details

**Scenario ID**: PAYMENT-FE-001.1-S2

**GIVEN**
* Stripe Elements is loaded with a valid `client_secret`

**WHEN**
* The customer enters valid card details and clicks "Pay"

**THEN**
* `stripe.confirmCardPayment(clientSecret)` is called client-side directly with Stripe
* On success, the customer is redirected to `/orders/:orderId/confirmation`

#### SCENARIO 3: Stripe payment failure shown to customer

**Scenario ID**: PAYMENT-FE-001.1-S3

**GIVEN**
* The customer submits card details

**WHEN**
* Stripe returns a payment error (e.g., card declined)

**THEN**
* The Stripe error message is displayed below the card input
* The customer can retry without reloading the page

---

### PAYMENT-BE-001.1: Create Payment Intent Endpoint

**Architecture Reference**: Section 5 — Building Block View (Payment Router + Service)

AS A frontend client
I WANT a `POST /payment/intents` endpoint
SO THAT a Stripe Payment Intent is created for a pending order and the `client_secret` is returned to the SPA

#### SCENARIO 1: Payment Intent created and persisted

**Scenario ID**: PAYMENT-BE-001.1-S1

**GIVEN**
* The order exists, belongs to the authenticated user, and has `status = 'PENDING'`

**WHEN**
* `POST /payment/intents` is called with `{ orderId }`

**THEN**
* Payment Service calls Stripe API: `stripe.paymentIntents.create({ amount, currency: 'usd', metadata: { orderId } })`
* A row is inserted into `payment.payment_intents`: `{ id, orderId, stripeIntentId, status: 'CREATED' }`
* Response is `201 Created` with `{ clientSecret }`
* Card data never passes through the bookstore API

#### SCENARIO 2: Duplicate intent request returns existing client_secret

**Scenario ID**: PAYMENT-BE-001.1-S2

**GIVEN**
* A Payment Intent already exists for the order in `payment.payment_intents`

**WHEN**
* `POST /payment/intents` is called again for the same order

**THEN**
* The existing `stripeIntentId` is retrieved from the DB
* Stripe API is called to retrieve the existing intent: `stripe.paymentIntents.retrieve(stripeIntentId)`
* The existing `clientSecret` is returned — no duplicate intent is created

---

### PAYMENT-INFRA-001.1: Deploy API Service as Docker Container

**Architecture Reference**: Section 7 — Deployment View

AS A developer
I WANT the API running in Docker with Stripe credentials injected via environment variables
SO THAT Payment Intent creation works correctly without hardcoded secrets

#### SCENARIO 1: Service starts with Stripe key configured

**Scenario ID**: PAYMENT-INFRA-001.1-S1

**GIVEN**
* `STRIPE_SECRET_KEY` is set as an environment variable (sourced from AWS Secrets Manager in production)
* `docker compose up` is executed

**WHEN**
* The API starts

**THEN**
* The Stripe client is initialised with the injected key
* `GET /health` returns `200 OK` with `{ status: "healthy", service: "api" }`
* No Stripe key appears in logs or error responses

---

### PAYMENT-INFRA-001.2: Create `payment` PostgreSQL Schema

**Architecture Reference**: Section 5 — Building Block View (DB Client / schema-per-context)

AS A developer
I WANT the `payment.payment_intents` table created via migration
SO THAT Payment Intent records are persisted for idempotency and webhook correlation

#### SCENARIO 1: Migration creates payment_intents table

**Scenario ID**: PAYMENT-INFRA-001.2-S1

**GIVEN**
* A PostgreSQL instance is running
* Migration file `migrations/payment/001_create_payment_intents.sql` exists

**WHEN**
* The migration script is executed via `node-pg-migrate`

**THEN**
* `payment.payment_intents` exists with columns: `id` (UUID PK), `order_id` (UUID UNIQUE NOT NULL), `stripe_intent_id` (VARCHAR UNIQUE NOT NULL), `status` (VARCHAR, default `CREATED`), `created_at`
* A UNIQUE constraint on `order_id` prevents duplicate intents per order
* A CHECK constraint on `status` allows only `CREATED`, `SUCCEEDED`, `FAILED`

---

### PAYMENT-INFRA-001.3: Configure Stripe Integration

**Architecture Reference**: Section 9 — Architecture Decisions (ADR-004)

AS A developer
I WANT the Stripe SDK configured with the secret key from environment variables
SO THAT Payment Intents can be created and the bookstore never handles raw card data

#### SCENARIO 1: Stripe client initialised at startup

**Scenario ID**: PAYMENT-INFRA-001.3-S1

**GIVEN**
* `STRIPE_SECRET_KEY` environment variable is set

**WHEN**
* The API process starts

**THEN**
* The Stripe Node.js SDK is initialised: `new Stripe(process.env.STRIPE_SECRET_KEY)`
* The Payment Service uses this client for all Stripe API calls
* No key value appears in application logs

#### SCENARIO 2: Stripe API error is handled gracefully

**Scenario ID**: PAYMENT-INFRA-001.3-S2

**GIVEN**
* The Stripe API returns an error (e.g., invalid key, network timeout)

**WHEN**
* `POST /payment/intents` is called

**THEN**
* The error is caught by the global error handler
* Response is `502 Bad Gateway` with `{ error: "Payment service unavailable" }`
* The raw Stripe error is logged server-side but not exposed to the client

---

### PAYMENT-INFRA-001.4: Setup Monitoring and Observability

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.3 Logging)

AS A developer
I WANT Payment Intent creation logged with order ID and Stripe intent ID
SO THAT I can correlate payment events with orders in production without exposing sensitive data

#### SCENARIO 1: Health check is reachable

**Scenario ID**: PAYMENT-INFRA-001.4-S1

**GIVEN**
* The API container is running

**WHEN**
* `GET /health` is called

**THEN**
* Response is `200 OK` with `{ status: "healthy", service: "api", version: "<semver>" }`

#### SCENARIO 2: Payment Intent creation logged

**Scenario ID**: PAYMENT-INFRA-001.4-S2

**GIVEN**
* A Payment Intent is successfully created

**WHEN**
* The request completes

**THEN**
* A structured JSON log line is emitted with `method`, `path`, `statusCode: 201`, `responseTimeMs`, `orderId`, and `stripeIntentId`
* No `clientSecret`, card data, or customer PII appears in the log

---

## PAYMENT-STORY-002: Handle Stripe Webhook (Payment Confirmation)

**Architecture Reference**: Section 6 — Runtime View (6.2 Payment Webhook)
**Priority**: CORE
**Pareto**: 20% core (delivers 80% value)

AS A system
I WANT to receive and verify Stripe webhook events for `payment_intent.succeeded`
SO THAT confirmed payments automatically transition orders from `PENDING` to `CONFIRMED` and trigger a confirmation email

### SCENARIO 1: Successful webhook transitions order to CONFIRMED

**Scenario ID**: PAYMENT-STORY-002-S1

**GIVEN**
* A `PENDING` order exists with a matching Payment Intent
* Stripe sends a `payment_intent.succeeded` webhook with a valid signature

**WHEN**
* `POST /payment/webhook` receives the event

**THEN**
* The Stripe signature is verified using `STRIPE_WEBHOOK_SECRET`
* `payment.payment_intents` status is updated to `SUCCEEDED`
* Orders Service is called in-process to transition the order to `CONFIRMED`
* Notifications Service enqueues an "order confirmed" Bull job
* Response is `200 OK`

### SCENARIO 2: Invalid Stripe signature rejected

**Scenario ID**: PAYMENT-STORY-002-S2

**GIVEN**
* A request arrives at `POST /payment/webhook`

**WHEN**
* The Stripe signature header is missing or does not match `STRIPE_WEBHOOK_SECRET`

**THEN**
* Response is `400 Bad Request`
* No order state change occurs
* The rejection is logged with the request metadata

### SCENARIO 3: Duplicate webhook is ignored (idempotency)

**Scenario ID**: PAYMENT-STORY-002-S3

**GIVEN**
* The webhook for a given `stripeIntentId` has already been processed
* `payment.payment_intents.status` is already `SUCCEEDED`

**WHEN**
* Stripe re-delivers the same `payment_intent.succeeded` event

**THEN**
* The handler detects the intent is already `SUCCEEDED`
* No duplicate order transition or email job is created
* Response is `200 OK` (idempotent acknowledgement)

---

### PAYMENT-FE-002.1: Order Confirmation Page

**Architecture Reference**: Section 6 — Runtime View (6.2 Payment Webhook)

AS A customer
I WANT to see an order confirmation page after payment succeeds
SO THAT I know my order has been placed and I will receive a confirmation email

#### SCENARIO 1: Confirmation page shows order summary

**Scenario ID**: PAYMENT-FE-002.1-S1

**GIVEN**
* Stripe has confirmed the payment client-side
* The customer is redirected to `/orders/:orderId/confirmation`

**WHEN**
* The page loads

**THEN**
* A `GET /orders/:orderId` request is made
* The page displays order ID, items, total, and status (`CONFIRMED` once webhook has processed, or `PENDING` if webhook is still in flight)
* A message is shown: "Your order is confirmed. A confirmation email is on its way."

#### SCENARIO 2: Polling handles webhook processing delay

**Scenario ID**: PAYMENT-FE-002.1-S2

**GIVEN**
* The customer lands on the confirmation page
* The order status is still `PENDING` (webhook not yet processed)

**WHEN**
* The page polls `GET /orders/:orderId` every 3 seconds (max 5 attempts)

**THEN**
* Once status becomes `CONFIRMED`, the UI updates to show the confirmed state
* If status remains `PENDING` after all attempts, a message is shown: "Payment received — your order is being confirmed."

---

### PAYMENT-BE-002.1: Stripe Webhook Endpoint

**Architecture Reference**: Section 5 — Building Block View (Payment Router + Service)

AS A Stripe webhook consumer
I WANT a `POST /payment/webhook` endpoint that verifies signatures and processes `payment_intent.succeeded` events
SO THAT order confirmation is driven by authoritative Stripe events, not client-side callbacks

#### SCENARIO 1: Verified webhook updates order state

**Scenario ID**: PAYMENT-BE-002.1-S1

**GIVEN**
* The raw request body and `stripe-signature` header are available
* `STRIPE_WEBHOOK_SECRET` is set in the environment

**WHEN**
* `POST /payment/webhook` receives a `payment_intent.succeeded` event

**THEN**
* `stripe.webhooks.constructEvent(rawBody, sig, secret)` succeeds
* `payment.payment_intents` row is updated: `status = 'SUCCEEDED'`
* `OrdersService.confirmOrder(orderId)` is called in-process: order status → `CONFIRMED`
* `NotificationsService.enqueue('order.confirmed', { orderId, userId })` is called
* Response is `200 OK`

#### SCENARIO 2: Signature verification failure returns 400

**Scenario ID**: PAYMENT-BE-002.1-S2

**GIVEN**
* The `stripe-signature` header is absent or tampered

**WHEN**
* `POST /payment/webhook` is called

**THEN**
* `stripe.webhooks.constructEvent` throws a `StripeSignatureVerificationError`
* Response is `400 Bad Request` with `{ error: "Invalid webhook signature" }`
* No state change occurs

#### SCENARIO 3: Raw body parsing preserved for signature verification

**Scenario ID**: PAYMENT-BE-002.1-S3

**GIVEN**
* Express is configured with `express.json()` globally

**WHEN**
* The webhook route is registered

**THEN**
* The `/payment/webhook` route uses `express.raw({ type: 'application/json' })` middleware instead of `express.json()`
* The raw buffer is passed to `stripe.webhooks.constructEvent` unchanged

---

### PAYMENT-INFRA-002.1: Deploy API Service as Docker Container

**Architecture Reference**: Section 7 — Deployment View

AS A developer
I WANT `STRIPE_WEBHOOK_SECRET` injected as an environment variable
SO THAT webhook signature verification works correctly in all environments

#### SCENARIO 1: Webhook endpoint reachable with correct middleware

**Scenario ID**: PAYMENT-INFRA-002.1-S1

**GIVEN**
* `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set as environment variables
* `docker compose up` is executed

**WHEN**
* A POST request with a valid Stripe signature is sent to `/payment/webhook`

**THEN**
* The raw body is preserved for signature verification
* The event is processed and `200 OK` is returned
* `GET /health` returns `200 OK`

---

### PAYMENT-INFRA-002.2: Update `payment` PostgreSQL Schema for Webhook Idempotency

**Architecture Reference**: Section 11 — Risks and Technical Debts (R-05)

AS A developer
I WANT the `payment.payment_intents` table to support idempotent webhook processing
SO THAT duplicate Stripe webhook deliveries do not cause duplicate order confirmations

#### SCENARIO 1: Duplicate webhook detected via status check

**Scenario ID**: PAYMENT-INFRA-002.2-S1

**GIVEN**
* `payment.payment_intents` has a UNIQUE constraint on `stripe_intent_id`
* A row with `status = 'SUCCEEDED'` already exists for the intent

**WHEN**
* The webhook handler queries `SELECT status FROM payment.payment_intents WHERE stripe_intent_id = $1`

**THEN**
* The existing `SUCCEEDED` status is detected
* The handler returns early without updating orders or enqueuing a job
* No migration change is required — the existing schema from PAYMENT-INFRA-001.2 is sufficient

---

### PAYMENT-INFRA-002.3: Configure Webhook Event Flow (Stripe → Orders → Notifications)

**Architecture Reference**: Section 6 — Runtime View (6.2 Payment Webhook)

AS A developer
I WANT the webhook handler to orchestrate the full confirmation flow in-process
SO THAT order confirmation and email notification are triggered reliably from a single authoritative event

#### SCENARIO 1: Full webhook flow executes in correct order

**Scenario ID**: PAYMENT-INFRA-002.3-S1

**GIVEN**
* The API is running with Stripe and Redis configured
* A valid `payment_intent.succeeded` webhook is received

**WHEN**
* The Payment Service processes the event

**THEN**
* Step 1: Stripe signature verified
* Step 2: `payment.payment_intents` status updated to `SUCCEEDED`
* Step 3: `OrdersService.confirmOrder(orderId)` transitions order to `CONFIRMED`
* Step 4: `NotificationsService.enqueue('order.confirmed', payload)` adds job to Bull queue
* All steps complete before `200 OK` is returned to Stripe
* If Step 4 fails (Redis down), the error is logged but steps 1–3 are not rolled back

---

### PAYMENT-INFRA-002.4: Setup Monitoring and Observability

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.3 Logging)

AS A developer
I WANT webhook events logged with intent ID and outcome
SO THAT I can audit payment confirmations and diagnose signature failures in production

#### SCENARIO 1: Health check is reachable

**Scenario ID**: PAYMENT-INFRA-002.4-S1

**GIVEN**
* The API container is running

**WHEN**
* `GET /health` is called

**THEN**
* Response is `200 OK` with `{ status: "healthy", service: "api", version: "<semver>" }`

#### SCENARIO 2: Webhook processing logged with outcome

**Scenario ID**: PAYMENT-INFRA-002.4-S2

**GIVEN**
* A webhook event is received and processed

**WHEN**
* The handler completes (success, duplicate, or signature failure)

**THEN**
* A structured JSON log line is emitted with `method`, `path`, `statusCode`, `responseTimeMs`, `stripeIntentId`, and `outcome` (`confirmed` | `duplicate` | `signature_invalid`)
* No card data, customer name, or email appears in the log
