# Orders Domain — Story Bundles

---

## ORDERS-STORY-001: Manage Shopping Cart

**Architecture Reference**: Section 1 — Introduction and Goals (G-03)
**Priority**: CORE
**Pareto**: 20% core (delivers 80% value)

AS A logged-in customer
I WANT to add books to my cart, update quantities, and remove items
SO THAT I can prepare my selection before placing an order

### SCENARIO 1: Add a book to the cart

**Scenario ID**: ORDERS-STORY-001-S1

**GIVEN**
* The customer is authenticated
* The requested book exists in the catalog and has stock available

**WHEN**
* The customer adds a book to their cart with a quantity of 1

**THEN**
* A cart item is created (or quantity incremented if already present)
* Response is `200 OK` with the updated cart contents

### SCENARIO 2: Update item quantity

**Scenario ID**: ORDERS-STORY-001-S2

**GIVEN**
* The customer has a book in their cart

**WHEN**
* The customer changes the quantity to 3

**THEN**
* The cart item quantity is updated to 3
* Response is `200 OK` with the updated cart

### SCENARIO 3: Remove an item from the cart

**Scenario ID**: ORDERS-STORY-001-S3

**GIVEN**
* The customer has at least one item in their cart

**WHEN**
* The customer removes a specific book from the cart

**THEN**
* The cart item is deleted
* Response is `200 OK` with the updated cart (item no longer present)

### SCENARIO 4: View current cart

**Scenario ID**: ORDERS-STORY-001-S4

**GIVEN**
* The customer is authenticated

**WHEN**
* The customer opens the cart page

**THEN**
* Response is `200 OK` with all current cart items: book title, quantity, unit price, line total
* Cart total is included in the response

---

### ORDERS-FE-001.1: Shopping Cart UI

**Architecture Reference**: Section 3 — System Scope and Context (3.4 Users)

AS A logged-in customer
I WANT a cart page showing my selected books with quantity controls and a total
SO THAT I can review and adjust my selection before checkout

#### SCENARIO 1: Add to cart from catalog

**Scenario ID**: ORDERS-FE-001.1-S1

**GIVEN**
* The customer is browsing the catalog

**WHEN**
* The customer clicks "Add to Cart" on a book

**THEN**
* A `POST /orders/cart/items` request is sent
* The cart icon in the header updates to reflect the new item count

#### SCENARIO 2: Update quantity in cart

**Scenario ID**: ORDERS-FE-001.1-S2

**GIVEN**
* The customer is on the `/cart` page

**WHEN**
* The customer changes the quantity input for a book

**THEN**
* A `PUT /orders/cart/items/:bookId` request is sent with the new quantity
* The line total and cart total update immediately in the UI

#### SCENARIO 3: Remove item from cart

**Scenario ID**: ORDERS-FE-001.1-S3

**GIVEN**
* The customer is on the `/cart` page

**WHEN**
* The customer clicks "Remove" on a cart item

**THEN**
* A `DELETE /orders/cart/items/:bookId` request is sent
* The item disappears from the cart; totals recalculate

#### SCENARIO 4: Empty cart shows prompt

**Scenario ID**: ORDERS-FE-001.1-S4

**GIVEN**
* The customer's cart has no items

**WHEN**
* The customer navigates to `/cart`

**THEN**
* An empty state message is shown: "Your cart is empty"
* A "Browse Catalog" link is displayed

---

### ORDERS-BE-001.1: Cart Management API

**Architecture Reference**: Section 5 — Building Block View (Orders Router + Service)

AS A frontend client
I WANT cart CRUD endpoints under `/orders/cart`
SO THAT authenticated customers can manage their cart items server-side

#### SCENARIO 1: Add item — POST /orders/cart/items

**Scenario ID**: ORDERS-BE-001.1-S1

**GIVEN**
* The request carries a valid JWT
* `{ bookId, quantity }` is provided in the request body

**WHEN**
* `POST /orders/cart/items` is called

**THEN**
* If the book is not in the cart: a new `orders.cart_items` row is inserted
* If the book is already in the cart: quantity is incremented
* Response is `200 OK` with the full updated cart

#### SCENARIO 2: Update quantity — PUT /orders/cart/items/:bookId

**Scenario ID**: ORDERS-BE-001.1-S2

**GIVEN**
* The cart item exists for the authenticated user

**WHEN**
* `PUT /orders/cart/items/:bookId` is called with `{ quantity: 3 }`

**THEN**
* The `quantity` column is updated to 3
* Response is `200 OK` with the updated cart

#### SCENARIO 3: Remove item — DELETE /orders/cart/items/:bookId

**Scenario ID**: ORDERS-BE-001.1-S3

**GIVEN**
* The cart item exists for the authenticated user

**WHEN**
* `DELETE /orders/cart/items/:bookId` is called

**THEN**
* The row is deleted from `orders.cart_items`
* Response is `200 OK` with the updated cart

#### SCENARIO 4: Get cart — GET /orders/cart

**Scenario ID**: ORDERS-BE-001.1-S4

**GIVEN**
* The customer is authenticated

**WHEN**
* `GET /orders/cart` is called

**THEN**
* Response is `200 OK` with `{ items: [{ bookId, title, quantity, unitPrice, lineTotal }], cartTotal }`
* Book title and price are fetched from the Catalog Service (in-process call), not via SQL join

---

### ORDERS-INFRA-001.1: Deploy API Service as Docker Container

**Architecture Reference**: Section 7 — Deployment View

AS A developer
I WANT the API running in Docker with PostgreSQL available
SO THAT cart operations persist correctly across requests

#### SCENARIO 1: Service starts and cart endpoint is reachable

**Scenario ID**: ORDERS-INFRA-001.1-S1

**GIVEN**
* `docker-compose.yml` defines `api`, `db`, and `redis` services

**WHEN**
* `docker compose up` is executed

**THEN**
* The API is reachable on port 3000
* `GET /health` returns `200 OK` with `{ status: "healthy", service: "api" }`
* `GET /orders/cart` with a valid JWT returns `200 OK`

---

### ORDERS-INFRA-001.2: Create `orders` PostgreSQL Schema — Cart Tables

**Architecture Reference**: Section 5 — Building Block View (DB Client / schema-per-context)

AS A developer
I WANT the `orders.cart_items` table created via migration
SO THAT cart state is persisted per user in the Orders context schema

#### SCENARIO 1: Migration creates cart_items table

**Scenario ID**: ORDERS-INFRA-001.2-S1

**GIVEN**
* A PostgreSQL instance is running
* Migration file `migrations/orders/001_create_cart.sql` exists

**WHEN**
* The migration script is executed via `node-pg-migrate`

**THEN**
* `orders.cart_items` table exists with columns: `id` (UUID PK), `user_id` (UUID NOT NULL), `book_id` (UUID NOT NULL), `quantity` (INTEGER, CHECK > 0), `added_at`
* A UNIQUE constraint exists on `(user_id, book_id)`

---

### ORDERS-INFRA-001.3: Configure Inter-context Integration Point (Catalog → Orders)

**Architecture Reference**: Section 6 — Runtime View (6.1 Place Order)

AS A developer
I WANT the Orders Service to retrieve book price and title from the Catalog Service via in-process call
SO THAT cart totals are accurate without cross-schema SQL joins

#### SCENARIO 1: Cart total uses live Catalog Service data

**Scenario ID**: ORDERS-INFRA-001.3-S1

**GIVEN**
* The API is running
* `orders.cart_items` contains rows for a user

**WHEN**
* `GET /orders/cart` is called

**THEN**
* The Orders Service calls `CatalogService.getBooksByIds(bookIds)` in-process
* Book titles and prices are returned without any SQL JOIN across schemas
* The cart response includes accurate `unitPrice` and `lineTotal` per item

> **Note**: No domain events are published by the cart management flow. The integration point is a synchronous in-process service call from Orders to Catalog (ADR-001). Events are introduced in ORDERS-STORY-002 (order placement).

---

### ORDERS-INFRA-001.4: Setup Monitoring and Observability

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.3 Logging)

AS A developer
I WANT cart operations logged with user context (user ID only, no PII)
SO THAT I can trace cart activity and debug issues without exposing personal data

#### SCENARIO 1: Health check is reachable

**Scenario ID**: ORDERS-INFRA-001.4-S1

**GIVEN**
* The API container is running

**WHEN**
* `GET /health` is called

**THEN**
* Response is `200 OK` with `{ status: "healthy", service: "api", version: "<semver>" }`

#### SCENARIO 2: Cart mutation logged with user ID

**Scenario ID**: ORDERS-INFRA-001.4-S2

**GIVEN**
* An authenticated customer adds, updates, or removes a cart item

**WHEN**
* The request completes

**THEN**
* A structured JSON log line is emitted with `method`, `path`, `statusCode`, `responseTimeMs`, and `userId`
* No book titles, prices, or customer names appear in the log line

---

## ORDERS-STORY-002: Place an Order

**Architecture Reference**: Section 1 — Introduction and Goals (G-03)
**Priority**: CORE
**Pareto**: 20% core (delivers 80% value)

AS A logged-in customer
I WANT to place an order from my cart
SO THAT my selected books are reserved and I can proceed to payment

### SCENARIO 1: Successful order placement

**Scenario ID**: ORDERS-STORY-002-S1

**GIVEN**
* The customer is authenticated and has items in their cart
* All books in the cart have sufficient stock

**WHEN**
* The customer submits the checkout

**THEN**
* A DB transaction opens, locks the relevant stock rows (`SELECT FOR UPDATE`), decrements stock, and creates an order in `PENDING` state
* The cart is cleared
* An "order received" email job is enqueued on the Redis Bull queue
* Response is `201 Created` with `{ orderId, status: "PENDING", items, total }`

### SCENARIO 2: Insufficient stock prevents order

**Scenario ID**: ORDERS-STORY-002-S2

**GIVEN**
* One or more books in the cart have less stock than the requested quantity

**WHEN**
* The customer submits the checkout

**THEN**
* The transaction is rolled back; no stock is decremented
* No order record is created
* Response is `409 Conflict` with `{ error: "Insufficient stock", bookId: "<id>" }`

### SCENARIO 3: Empty cart cannot be checked out

**Scenario ID**: ORDERS-STORY-002-S3

**GIVEN**
* The customer's cart has no items

**WHEN**
* The customer attempts to place an order

**THEN**
* Response is `400 Bad Request` with `{ error: "Cart is empty" }`
* No DB transaction is opened

---

### ORDERS-FE-002.1: Checkout Flow UI

**Architecture Reference**: Section 6 — Runtime View (6.1 Place Order)

AS A logged-in customer
I WANT a checkout button on the cart page that initiates order placement
SO THAT I can confirm my purchase and proceed to payment

#### SCENARIO 1: Successful checkout transitions to payment

**Scenario ID**: ORDERS-FE-002.1-S1

**GIVEN**
* The customer is on the `/cart` page with items in the cart

**WHEN**
* The customer clicks "Proceed to Checkout"

**THEN**
* A `POST /orders` request is sent
* On `201` response, the customer is redirected to `/payment/:orderId` with the `orderId`
* The cart icon resets to 0

#### SCENARIO 2: Insufficient stock error shown inline

**Scenario ID**: ORDERS-FE-002.1-S2

**GIVEN**
* The customer clicks "Proceed to Checkout"

**WHEN**
* The API returns `409 Conflict`

**THEN**
* An error banner is shown: "One or more items are out of stock. Please update your cart."
* The customer remains on the cart page

#### SCENARIO 3: Checkout button disabled during request

**Scenario ID**: ORDERS-FE-002.1-S3

**GIVEN**
* The customer clicks "Proceed to Checkout"

**WHEN**
* The API request is in flight

**THEN**
* The checkout button is disabled and shows a loading indicator
* Prevents duplicate order submissions

---

### ORDERS-BE-002.1: Place Order API Endpoint

**Architecture Reference**: Section 5 — Building Block View (Orders Router + Service)

AS A frontend client
I WANT a `POST /orders` endpoint that atomically reserves stock and creates an order
SO THAT no overselling occurs under concurrent requests

#### SCENARIO 1: Atomic stock decrement and order creation

**Scenario ID**: ORDERS-BE-002.1-S1

**GIVEN**
* The customer has items in `orders.cart_items`
* All books have sufficient stock in `catalog.books`

**WHEN**
* `POST /orders` is called with a valid JWT

**THEN**
* A PostgreSQL transaction opens
* Each book row in `catalog.books` is locked with `SELECT FOR UPDATE`
* Stock is decremented by the ordered quantity
* A row is inserted into `orders.orders` with `status = 'PENDING'`
* Rows are inserted into `orders.order_items`
* `orders.cart_items` rows for this user are deleted
* Transaction commits
* Notifications Service is called in-process to enqueue an "order received" Bull job
* Response is `201 Created` with `{ orderId, status: "PENDING", items, total }`

#### SCENARIO 2: Concurrent order rolls back on insufficient stock

**Scenario ID**: ORDERS-BE-002.1-S2

**GIVEN**
* Two customers attempt to buy the last copy simultaneously
* `SELECT FOR UPDATE` serialises access

**WHEN**
* The second transaction checks stock after the first has decremented it

**THEN**
* The second transaction detects stock = 0 and rolls back
* Response is `409 Conflict` with `{ error: "Insufficient stock", bookId: "<id>" }`
* Stock never goes negative

---

### ORDERS-INFRA-002.1: Deploy API Service as Docker Container

**Architecture Reference**: Section 7 — Deployment View

AS A developer
I WANT the API, PostgreSQL, and Redis running together in Docker
SO THAT order placement with stock locking and async email queuing works end-to-end

#### SCENARIO 1: Full order placement flow works in Docker

**Scenario ID**: ORDERS-INFRA-002.1-S1

**GIVEN**
* `docker compose up` has started `api`, `db`, and `redis`

**WHEN**
* `POST /orders` is called with a valid JWT and a non-empty cart

**THEN**
* Order is created in PostgreSQL, stock is decremented, Bull job is enqueued in Redis
* Response is `201 Created`
* `GET /health` returns `200 OK`

---

### ORDERS-INFRA-002.2: Create `orders` PostgreSQL Schema — Orders Tables

**Architecture Reference**: Section 5 — Building Block View (DB Client / schema-per-context)

AS A developer
I WANT `orders.orders` and `orders.order_items` tables created via migration
SO THAT placed orders and their line items are persisted with correct constraints

#### SCENARIO 1: Migration creates orders tables

**Scenario ID**: ORDERS-INFRA-002.2-S1

**GIVEN**
* A PostgreSQL instance is running
* Migration file `migrations/orders/002_create_orders.sql` exists

**WHEN**
* The migration script is executed via `node-pg-migrate`

**THEN**
* `orders.orders` exists with columns: `id` (UUID PK), `user_id` (UUID NOT NULL), `status` (VARCHAR, default `PENDING`), `total` (NUMERIC), `created_at`
* `orders.order_items` exists with columns: `id` (UUID PK), `order_id` (UUID FK → orders.orders), `book_id` (UUID NOT NULL), `quantity` (INTEGER > 0), `unit_price` (NUMERIC)
* A CHECK constraint on `orders.orders.status` allows only `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`

---

### ORDERS-INFRA-002.3: Configure Event Publishing — Order Received

**Architecture Reference**: Section 6 — Runtime View (6.1 Place Order)

AS A developer
I WANT an "order received" email job enqueued on the Redis Bull queue when an order is placed
SO THAT the Notification Worker can send a confirmation email without blocking the order response

#### SCENARIO 1: Bull job enqueued on order creation

**Scenario ID**: ORDERS-INFRA-002.3-S1

**GIVEN**
* Redis is running and the Bull queue `email-notifications` is configured
* An order is successfully created

**WHEN**
* The Orders Service calls `NotificationsService.enqueue('order.received', { orderId, userId, items, total })` in-process

**THEN**
* A job is added to the `email-notifications` Bull queue in Redis
* The job payload contains `orderId`, `userId`, and order summary
* The HTTP response is returned to the client without waiting for the job to be processed

#### SCENARIO 2: Email queue failure does not fail the order

**Scenario ID**: ORDERS-INFRA-002.3-S2

**GIVEN**
* Redis is temporarily unavailable when the order is placed

**WHEN**
* `NotificationsService.enqueue(...)` throws an error

**THEN**
* The error is caught and logged
* The order creation transaction has already committed — the order is not rolled back
* Response is still `201 Created`

---

### ORDERS-INFRA-002.4: Setup Monitoring and Observability

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.3 Logging)

AS A developer
I WANT order placement logged with order ID and user ID
SO THAT I can trace order creation and diagnose failures in production

#### SCENARIO 1: Health check is reachable

**Scenario ID**: ORDERS-INFRA-002.4-S1

**GIVEN**
* The API container is running

**WHEN**
* `GET /health` is called

**THEN**
* Response is `200 OK` with `{ status: "healthy", service: "api", version: "<semver>" }`

#### SCENARIO 2: Order placement logged with order ID

**Scenario ID**: ORDERS-INFRA-002.4-S2

**GIVEN**
* A customer places an order successfully

**WHEN**
* The request completes

**THEN**
* A structured JSON log line is emitted with `method`, `path`, `statusCode: 201`, `responseTimeMs`, `orderId`, and `userId`
* No book titles, prices, or customer names appear in the log line
