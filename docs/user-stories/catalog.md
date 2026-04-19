# Catalog Domain — Story Bundles

---

## CATALOG-STORY-001: Browse & Search Book Catalog

**Architecture Reference**: Section 1 — Introduction and Goals (G-02)
**Priority**: CORE
**Pareto**: 20% core (delivers 80% value)

AS A customer
I WANT to browse and search the book catalog by title, author, or category
SO THAT I can discover books I want to purchase

### SCENARIO 1: Search returns matching results

**Scenario ID**: CATALOG-STORY-001-S1

**GIVEN**
* The catalog contains books with titles, authors, and categories
* The customer submits a search query

**WHEN**
* The customer searches for a keyword that matches one or more books

**THEN**
* A paginated list of matching books is returned (title, author, price, cover image URL, stock status)
* Results are returned within 500ms at p95

### SCENARIO 2: Search with no results returns empty list

**Scenario ID**: CATALOG-STORY-001-S2

**GIVEN**
* No books match the submitted query

**WHEN**
* The customer searches for a keyword

**THEN**
* Response is `200 OK` with `{ items: [], total: 0 }`

### SCENARIO 3: Cache hit returns result without DB query

**Scenario ID**: CATALOG-STORY-001-S3

**GIVEN**
* The same search query was made recently and the result is cached in Redis

**WHEN**
* The customer submits the same search query again within the TTL window

**THEN**
* The result is returned from Redis cache
* No PostgreSQL query is executed

---

### CATALOG-FE-001.1: Catalog Search & Browse UI

**Architecture Reference**: Section 3 — System Scope and Context (3.4 Users)

AS A customer
I WANT a search bar and browsable book grid on the catalog page
SO THAT I can find books by keyword and visually scan available titles

#### SCENARIO 1: Customer searches by keyword

**Scenario ID**: CATALOG-FE-001.1-S1

**GIVEN**
* The customer is on the `/catalog` page

**WHEN**
* The customer types a keyword in the search bar and submits

**THEN**
* A `GET /catalog/books?q=<keyword>&page=1&limit=20` request is sent
* The book grid updates to show matching results with title, author, price, and cover image
* A result count is displayed (e.g., "24 results")

#### SCENARIO 2: Empty search results shown gracefully

**Scenario ID**: CATALOG-FE-001.1-S2

**GIVEN**
* The customer submits a search query

**WHEN**
* The API returns `{ items: [], total: 0 }`

**THEN**
* The book grid shows an empty state message: "No books found for your search"

#### SCENARIO 3: Pagination navigates through results

**Scenario ID**: CATALOG-FE-001.1-S3

**GIVEN**
* The search returns more than 20 results

**WHEN**
* The customer clicks "Next page"

**THEN**
* A new request is sent with `page=2`
* The book grid updates with the next page of results

---

### CATALOG-BE-001.1: Book Search API Endpoint

**Architecture Reference**: Section 5 — Building Block View (Catalog Router + Service)

AS A frontend client
I WANT a `GET /catalog/books` endpoint with query, pagination, and category filter support
SO THAT customers can search and browse the catalog efficiently

#### SCENARIO 1: Full-text search returns paginated results

**Scenario ID**: CATALOG-BE-001.1-S1

**GIVEN**
* Books exist in `catalog.books`
* Redis does not have a cached result for this query

**WHEN**
* `GET /catalog/books?q=tolkien&page=1&limit=20` is called

**THEN**
* A PostgreSQL query runs against `catalog.books` using `ILIKE` or full-text search on title and author
* Response is `200 OK` with `{ items: [...], total: <n>, page: 1, limit: 20 }`
* Result is stored in Redis with a 5-minute TTL

#### SCENARIO 2: Cache hit bypasses DB

**Scenario ID**: CATALOG-BE-001.1-S2

**GIVEN**
* Redis contains a cached result for the same query key

**WHEN**
* `GET /catalog/books?q=tolkien&page=1&limit=20` is called

**THEN**
* The cached result is returned directly
* No SQL query is executed against PostgreSQL

#### SCENARIO 3: Category filter narrows results

**Scenario ID**: CATALOG-BE-001.1-S3

**GIVEN**
* Books exist across multiple categories

**WHEN**
* `GET /catalog/books?category=fantasy&page=1&limit=20` is called

**THEN**
* Only books in the `fantasy` category are returned
* Response structure matches the standard paginated format

---

### CATALOG-INFRA-001.1: Deploy API Service as Docker Container

**Architecture Reference**: Section 7 — Deployment View

AS A developer
I WANT the API and Redis running together in Docker
SO THAT catalog search with caching works correctly in all environments

#### SCENARIO 1: Service starts and catalog endpoint is reachable

**Scenario ID**: CATALOG-INFRA-001.1-S1

**GIVEN**
* `docker-compose.yml` defines `api`, `db`, and `redis` services

**WHEN**
* `docker compose up` is executed

**THEN**
* The API is reachable on port 3000
* `GET /health` returns `200 OK` with `{ status: "healthy", service: "api" }`
* `GET /catalog/books` returns `200 OK`

---

### CATALOG-INFRA-001.2: Create `catalog` PostgreSQL Schema

**Architecture Reference**: Section 5 — Building Block View (DB Client / schema-per-context)

AS A developer
I WANT the `catalog` schema with `books` and `categories` tables created via migration
SO THAT book data can be persisted and queried efficiently

#### SCENARIO 1: Migration creates catalog tables

**Scenario ID**: CATALOG-INFRA-001.2-S1

**GIVEN**
* A PostgreSQL instance is running
* Migration file `migrations/catalog/001_create_catalog.sql` exists

**WHEN**
* The migration script is executed via `node-pg-migrate`

**THEN**
* `catalog.books` table exists with columns: `id` (UUID PK), `title`, `author`, `category_id` (FK), `price` (NUMERIC), `stock` (INTEGER ≥ 0), `cover_image_key`, `created_at`
* `catalog.categories` table exists with columns: `id` (UUID PK), `name` (UNIQUE NOT NULL)
* An index exists on `catalog.books(title, author)` to support search queries
* A CHECK constraint ensures `stock >= 0`

---

### CATALOG-INFRA-001.3: Configure Redis Cache Invalidation on Catalog Writes

**Architecture Reference**: Section 6 — Runtime View (6.3 Catalog Search)

AS A developer
I WANT catalog search cache entries invalidated when book data changes
SO THAT customers never see stale catalog results after an admin update

#### SCENARIO 1: Cache is populated on cache miss

**Scenario ID**: CATALOG-INFRA-001.3-S1

**GIVEN**
* Redis does not contain a result for the query key `catalog:search:<hash>`

**WHEN**
* `GET /catalog/books?q=tolkien` is called

**THEN**
* PostgreSQL is queried
* The result is stored in Redis under `catalog:search:<hash>` with TTL of 300 seconds

#### SCENARIO 2: Cache is invalidated on book write

**Scenario ID**: CATALOG-INFRA-001.3-S2

**GIVEN**
* Redis contains cached search results

**WHEN**
* An admin creates, updates, or deletes a book (via Catalog Service)

**THEN**
* All keys matching `catalog:search:*` are deleted from Redis
* The next search request triggers a fresh DB query

> **Note**: The Catalog context does not publish domain events to other contexts. Cache invalidation is handled in-process within the Catalog Service on write operations (ADR-001, ADR-003).

---

### CATALOG-INFRA-001.4: Setup Monitoring and Observability

**Architecture Reference**: Section 8 — Cross-cutting Concepts (8.3 Logging)

AS A developer
I WANT catalog search requests logged with cache hit/miss indicators
SO THAT I can monitor cache effectiveness and diagnose performance issues

#### SCENARIO 1: Health check is reachable

**Scenario ID**: CATALOG-INFRA-001.4-S1

**GIVEN**
* The API container is running

**WHEN**
* `GET /health` is called

**THEN**
* Response is `200 OK` with `{ status: "healthy", service: "api", version: "<semver>" }`

#### SCENARIO 2: Search request logged with cache outcome

**Scenario ID**: CATALOG-INFRA-001.4-S2

**GIVEN**
* A catalog search request is processed

**WHEN**
* The request completes (cache hit or miss)

**THEN**
* A structured JSON log line is emitted with `method`, `path`, `statusCode`, `responseTimeMs`, and `cacheHit: true|false`
* No book titles or user data that could constitute PII appear in the log
