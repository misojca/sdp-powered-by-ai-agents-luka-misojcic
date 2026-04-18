# Users Domain — Story Bundles

---

## USERS-STORY-001: User Registration

**Architecture Reference**: Section 1 — Introduction and Goals (G-01)
**Priority**: CORE
**Pareto**: 20% core (delivers 80% value)

AS A new visitor
I WANT to register an account with my name, email, and password
SO THAT I can log in and place orders on the bookstore

### SCENARIO 1: Successful registration

**Scenario ID**: USERS-STORY-001-S1

**GIVEN**
* The visitor is not logged in
* The email address is not already registered

**WHEN**
* The visitor submits a valid name, email, and password

**THEN**
* A new user account is created
* The password is stored as a bcrypt hash (min cost 12)
* The visitor receives a 201 response with their user ID and email
* No PII appears in application logs

### SCENARIO 2: Duplicate email rejected

**Scenario ID**: USERS-STORY-001-S2

**GIVEN**
* An account with the same email already exists

**WHEN**
* A visitor submits a registration request with that email

**THEN**
* The API returns HTTP 409 Conflict
* No new user record is created

### SCENARIO 3: Invalid input rejected

**Scenario ID**: USERS-STORY-001-S3

**GIVEN**
* The visitor submits a registration form

**WHEN**
* The request body is missing required fields or contains an invalid email format

**THEN**
* The API returns HTTP 400 Bad Request with a structured validation error
* No database write occurs

---

### USERS-FE-001.1: Registration Form

**Architecture Reference**: Section 3 — System Scope and Context (3.4 Users)

AS A new visitor
I WANT a registration form with name, email, and password fields
SO THAT I can create an account without leaving the SPA

#### SCENARIO 1: Successful form submission

**Scenario ID**: USERS-FE-001.1-S1

**GIVEN**
* The visitor is on the `/register` page

**WHEN**
* The visitor fills in valid name, email, and password and submits the form

**THEN**
* A POST request is sent to `POST /users/register`
* The visitor is redirected to the login page
* A success message is displayed

#### SCENARIO 2: Client-side validation error

**Scenario ID**: USERS-FE-001.1-S2

**GIVEN**
* The visitor is on the `/register` page

**WHEN**
* The visitor submits the form with an empty email field

**THEN**
* An inline validation error is shown beneath the email field
* No API request is made

#### SCENARIO 3: Server-side duplicate email error

**Scenario ID**: USERS-FE-001.1-S3

**GIVEN**
* The visitor submits a valid form with an already-registered email

**WHEN**
* The API returns HTTP 409

**THEN**
* An error message "Email already in use" is displayed on the form
* The form remains editable

---

### USERS-BE-001.1: Registration API Endpoint

**Architecture Reference**: Section 5 — Building Block View (Users Router + Service)

AS A frontend client
I WANT a `POST /users/register` endpoint
SO THAT new user accounts can be created with a hashed password

#### SCENARIO 1: Valid registration persisted

**Scenario ID**: USERS-BE-001.1-S1

**GIVEN**
* The `users` schema exists in PostgreSQL
* The email is not already registered

**WHEN**
* `POST /users/register` is called with `{ name, email, password }`

**THEN**
* The password is hashed with bcrypt (cost ≥ 12)
* A new row is inserted into `users.users`
* Response is `201 Created` with `{ id, email }`

#### SCENARIO 2: Duplicate email returns 409

**Scenario ID**: USERS-BE-001.1-S2

**GIVEN**
* A user with the same email already exists

**WHEN**
* `POST /users/register` is called with that email

**THEN**
* Response is `409 Conflict` with `{ error: "Email already in use" }`
* No new row is inserted

#### SCENARIO 3: Invalid body returns 400

**Scenario ID**: USERS-BE-001.1-S3

**GIVEN**
* The endpoint receives a request

**WHEN**
* The request body fails zod schema validation (e.g., missing email)

**THEN**
* Response is `400 Bad Request` with structured zod error details
* Validation is applied before any service or DB call

---

### USERS-INFRA-001.1: Deploy API Service as Docker Container

**Architecture Reference**: Section 7 — Deployment View

AS A developer
I WANT the Node.js/Express API deployed as a Docker container
SO THAT it is isolated, reproducible, and runnable in all environments

#### SCENARIO 1: Service starts successfully

**Scenario ID**: USERS-INFRA-001.1-S1

**GIVEN**
* A Dockerfile exists at the project root
* `docker-compose.yml` defines the `api`, `db`, and `redis` services

**WHEN**
* `docker compose up` is executed

**THEN**
* The API container starts and listens on port 3000
* `GET /health` returns `200 OK` with `{ status: "healthy", service: "api" }`

---

### USERS-INFRA-001.2: Create `users` PostgreSQL Schema

**Architecture Reference**: Section 5 — Building Block View (DB Client / schema-per-context)

AS A developer
I WANT the `users` schema and `users.users` table created via migration
SO THAT user records can be persisted with correct constraints

#### SCENARIO 1: Migration creates the table

**Scenario ID**: USERS-INFRA-001.2-S1

**GIVEN**
* A PostgreSQL instance is running
* The migration file `migrations/users/001_create_users.sql` exists

**WHEN**
* The migration script is executed (via `node-pg-migrate`)

**THEN**
* The `users.users` table exists with columns: `id` (UUID PK), `name`, `email` (UNIQUE NOT NULL), `password_hash`, `role` (default `customer`), `created_at`
* A UNIQUE constraint exists on `email`

---

### USERS-INFRA-001.3: Configure Inter-context Integration Point

**Architecture Reference**: Section 6 — Runtime View (6.1 Place Order)

AS A developer
I WANT the Users context to expose a verified-user interface consumed by other contexts
SO THAT bounded contexts remain decoupled while sharing identity

#### SCENARIO 1: Auth middleware attaches user to request

**Scenario ID**: USERS-INFRA-001.3-S1

**GIVEN**
* The API is running
* A valid JWT is present in the `Authorization: Bearer` header

**WHEN**
* Any protected route (Orders, Catalog write, Payment) receives a request

**THEN**
* `src/shared/auth.js` validates the JWT and attaches `req.user` (`{ id, role }`)
* The downstream router receives the request with `req.user` populated
* No direct DB call to `users.users` is made by other contexts

> **Note**: The Users context does not publish domain events. Integration with other contexts is via the shared JWT auth middleware (`src/shared/auth.js`). This is the designated integration point per ADR-001 (modular monolith, in-process service calls).

---

### USERS-INFRA-001.4: Setup Monitoring and Observability

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.3 Logging)

AS A developer
I WANT structured JSON logging and a `/health` endpoint
SO THAT I can monitor service health and debug issues without exposing PII

#### SCENARIO 1: Health check is reachable

**Scenario ID**: USERS-INFRA-001.4-S1

**GIVEN**
* The API container is running

**WHEN**
* `GET /health` is called

**THEN**
* Response is `200 OK`
* Body contains `{ status: "healthy", service: "api", version: "<semver>" }`

#### SCENARIO 2: Registration request is logged without PII

**Scenario ID**: USERS-INFRA-001.4-S2

**GIVEN**
* `pino` logger is configured with PII redaction
* A registration request is processed

**WHEN**
* The request completes (success or error)

**THEN**
* A structured JSON log line is emitted with `method`, `path`, `statusCode`, `responseTimeMs`
* The log line does NOT contain the user's email or name

---

## USERS-STORY-002: User Login & JWT Issuance

**Architecture Reference**: Section 1 — Introduction and Goals (G-01)
**Priority**: CORE
**Pareto**: 20% core (delivers 80% value)

AS A registered customer
I WANT to log in with my email and password
SO THAT I receive a JWT access token and refresh token to authenticate subsequent requests

### SCENARIO 1: Successful login

**Scenario ID**: USERS-STORY-002-S1

**GIVEN**
* A user account exists with the given email
* The provided password matches the stored bcrypt hash

**WHEN**
* The user submits their email and password

**THEN**
* A short-lived JWT access token (15 min) is returned
* A refresh token (7 days) is stored in Redis and returned to the client
* Response is `200 OK` with `{ accessToken, refreshToken }`

### SCENARIO 2: Wrong password rejected

**Scenario ID**: USERS-STORY-002-S2

**GIVEN**
* A user account exists with the given email

**WHEN**
* The user submits an incorrect password

**THEN**
* Response is `401 Unauthorized` with `{ error: "Invalid credentials" }`
* No token is issued

### SCENARIO 3: Unknown email rejected

**Scenario ID**: USERS-STORY-002-S3

**GIVEN**
* No account exists for the submitted email

**WHEN**
* The user submits a login request

**THEN**
* Response is `401 Unauthorized` with `{ error: "Invalid credentials" }`
* The response is identical to the wrong-password case (no user enumeration)

---

### USERS-FE-002.1: Login Form

**Architecture Reference**: Section 3 — System Scope and Context (3.4 Users)

AS A registered customer
I WANT a login form with email and password fields
SO THAT I can authenticate and access protected features of the SPA

#### SCENARIO 1: Successful login redirects to catalog

**Scenario ID**: USERS-FE-002.1-S1

**GIVEN**
* The customer is on the `/login` page

**WHEN**
* The customer submits valid credentials

**THEN**
* The access token is stored in memory (not localStorage)
* The refresh token is stored in an `HttpOnly` cookie
* The customer is redirected to `/catalog`

#### SCENARIO 2: Invalid credentials shows error

**Scenario ID**: USERS-FE-002.1-S2

**GIVEN**
* The customer is on the `/login` page

**WHEN**
* The API returns `401 Unauthorized`

**THEN**
* An error message "Invalid email or password" is displayed
* The form remains editable; no redirect occurs

#### SCENARIO 3: Protected route redirects unauthenticated user to login

**Scenario ID**: USERS-FE-002.1-S3

**GIVEN**
* The customer has no valid access token

**WHEN**
* The customer navigates to a protected route (e.g., `/orders`)

**THEN**
* The customer is redirected to `/login`

---

### USERS-BE-002.1: Login API Endpoint

**Architecture Reference**: Section 5 — Building Block View (Users Router + Service)

AS A frontend client
I WANT a `POST /users/login` endpoint
SO THAT valid credentials are exchanged for a JWT access token and a Redis-backed refresh token

#### SCENARIO 1: Valid credentials return tokens

**Scenario ID**: USERS-BE-002.1-S1

**GIVEN**
* A user row exists in `users.users` with a matching bcrypt hash

**WHEN**
* `POST /users/login` is called with `{ email, password }`

**THEN**
* bcrypt comparison succeeds
* A JWT is signed with `{ userId, role }` claims, expiry 15 min
* A refresh token (UUID) is stored in Redis with a 7-day TTL under key `refresh:<token>`
* Response is `200 OK` with `{ accessToken, refreshToken }`

#### SCENARIO 2: Invalid credentials return 401

**Scenario ID**: USERS-BE-002.1-S2

**GIVEN**
* The email does not exist, or the password does not match

**WHEN**
* `POST /users/login` is called

**THEN**
* Response is `401 Unauthorized` with `{ error: "Invalid credentials" }`
* The same response is returned for both cases (no user enumeration)

#### SCENARIO 3: Logout deletes refresh token from Redis

**Scenario ID**: USERS-BE-002.1-S3

**GIVEN**
* A valid refresh token exists in Redis

**WHEN**
* `POST /users/logout` is called with the refresh token

**THEN**
* The Redis key `refresh:<token>` is deleted
* Response is `204 No Content`
* Subsequent use of that refresh token returns `401`

---

### USERS-INFRA-002.1: Deploy API Service as Docker Container

**Architecture Reference**: Section 7 — Deployment View

AS A developer
I WANT the Node.js/Express API running in Docker with Redis available
SO THAT login and token refresh work correctly in all environments

#### SCENARIO 1: API and Redis start together

**Scenario ID**: USERS-INFRA-002.1-S1

**GIVEN**
* `docker-compose.yml` defines `api`, `db`, and `redis` services

**WHEN**
* `docker compose up` is executed

**THEN**
* The API container connects to Redis on startup
* `GET /health` returns `200 OK` with `{ status: "healthy", service: "api" }`

---

### USERS-INFRA-002.2: Redis Key Schema for Refresh Tokens

**Architecture Reference**: Section 5 — Building Block View (Redis — cache + queue)

AS A developer
I WANT refresh tokens stored in Redis with a defined key schema and TTL
SO THAT sessions can be revoked server-side and expire automatically

#### SCENARIO 1: Refresh token is stored and expires

**Scenario ID**: USERS-INFRA-002.2-S1

**GIVEN**
* Redis is running and reachable by the API

**WHEN**
* A user logs in successfully

**THEN**
* A key `refresh:<uuid>` is set in Redis with value `<userId>` and TTL of 604800 seconds (7 days)
* After TTL expiry, the key no longer exists in Redis

#### SCENARIO 2: Logout removes the key immediately

**Scenario ID**: USERS-INFRA-002.2-S2

**GIVEN**
* Key `refresh:<uuid>` exists in Redis

**WHEN**
* `POST /users/logout` is called with that token

**THEN**
* `DEL refresh:<uuid>` is executed
* The key is no longer present in Redis

---

### USERS-INFRA-002.3: Auth Middleware Validates JWT on Protected Routes

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.1 Authentication & Authorization)

AS A developer
I WANT the shared JWT auth middleware to reject expired or invalid tokens
SO THAT no protected route is reachable without a valid access token

#### SCENARIO 1: Valid JWT passes through

**Scenario ID**: USERS-INFRA-002.3-S1

**GIVEN**
* The API is running
* A request carries a valid, non-expired JWT in `Authorization: Bearer <token>`

**WHEN**
* The request reaches a protected route

**THEN**
* `req.user` is populated with `{ id, role }`
* The request proceeds to the route handler

#### SCENARIO 2: Expired or missing JWT is rejected

**Scenario ID**: USERS-INFRA-002.3-S2

**GIVEN**
* A request has no token, or carries an expired JWT

**WHEN**
* The request reaches a protected route

**THEN**
* Auth middleware returns `401 Unauthorized`
* The route handler is never invoked

> **Note**: Inter-context integration is via this shared middleware. No domain events are published by the Users context (modular monolith, ADR-001).

---

### USERS-INFRA-002.4: Setup Monitoring and Observability

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.3 Logging)

AS A developer
I WANT login attempts logged (without PII) and the health endpoint to reflect Redis connectivity
SO THAT auth issues are diagnosable in production without exposing user data

#### SCENARIO 1: Health check reflects Redis status

**Scenario ID**: USERS-INFRA-002.4-S1

**GIVEN**
* The API is running

**WHEN**
* `GET /health` is called

**THEN**
* Response is `200 OK` with `{ status: "healthy", service: "api", redis: "connected" }`
* If Redis is unreachable, response is `503` with `{ status: "degraded", redis: "disconnected" }`

#### SCENARIO 2: Failed login is logged without PII

**Scenario ID**: USERS-INFRA-002.4-S2

**GIVEN**
* A login attempt fails (wrong password or unknown email)

**WHEN**
* The request completes

**THEN**
* A structured JSON log line is emitted with `method`, `path`, `statusCode: 401`, `responseTimeMs`
* The log line does NOT contain the submitted email address
