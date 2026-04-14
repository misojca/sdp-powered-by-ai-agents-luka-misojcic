# Chapter 9: Architecture Decisions

## ADR-001: Technology Stack for Parking Lot Kata

**Status:** Accepted

**Context:**
The Parking Lot kata requires managing vehicle entry/exit, real-time spot
availability tracking, and payment processing across 3 bounded contexts:
Entry/Exit, Availability, and Payment. The system needs to be simple to
run locally, easy to test, and straightforward to extend.

**Decision:**
Use Python (FastAPI) for the backend services, PostgreSQL for data storage,
and PlantUML/C4 for architecture diagrams.

**Rationale:**
- Python is concise and readable, reducing boilerplate for a kata
- FastAPI provides async support and auto-generated OpenAPI docs out of the box
- PostgreSQL handles relational data (spots, sessions, transactions) reliably
- A single PostgreSQL instance keeps local setup simple (one `docker-compose up`)
- PlantUML integrates with the pre-commit hook already configured in this repo

**Consequences:**
- All three bounded contexts share one database; schema boundaries enforced by separate schemas (`entry`, `availability`, `payment`)
- Team must run Docker locally for PostgreSQL
- Switching to a distributed data store later would require schema migration work
