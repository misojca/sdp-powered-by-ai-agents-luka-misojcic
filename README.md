# Online Bookstore — Software Development Processes Powered by AI Agents

A full-stack bookstore REST API built using AI-assisted development with strict TDD/BDD discipline across all modules.

## What This Kata Solves

An e-commerce platform where customers can browse books, manage a shopping cart, place orders, and process payments via Stripe. Built as a coding kata to demonstrate AI-agent-driven software development following the RED-GREEN-REFACTOR cycle.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| API | Express.js |
| Validation | Zod |
| Auth | JWT (UUID-based tokens) |
| Payments | Stripe (webhooks) |
| Testing | Jest + Supertest |
| CI/CD | GitHub Actions |
| Containerization | Docker |

## How to Build and Run Locally

Build and run tests inside Docker:

```bash
docker build -t kata-tests .
docker run --rm kata-tests
```

## How to Run Tests

```bash
npm install
npm test
```

## Project Structure

```
src/
  users/           # Registration, login, logout
  catalog/         # Book search and browsing
  orders/          # Shopping cart and order placement
  payment/         # Stripe payment intents and webhooks
  app.js           # Express app entry point
  db.js            # PostgreSQL connection pool
docs/
  architecture/    # arc42 documentation (12 chapters)
  user-stories/    # Story inventory and bundles
tests/
  users/           # User registration and login tests
  catalog/         # Book search tests
  orders/          # Cart and order tests
  payment/         # Payment intent and webhook tests
.kiro/agents/      # AI agents (git, architecture, requirements, cicd, tdd-bdd)
.github/workflows/ # CI/CD pipelines
```

## Architecture

The system follows Domain-Driven Design with 5 bounded contexts: Users, Catalog, Orders, Payment, and Notifications. Full arc42 documentation is available in `docs/architecture/`.

## AI Agents Used

| Module | Agent | Purpose |
|--------|-------|---------|
| M1 | git-agent | Issues, branches, PRs |
| M2 | architecture-agent | arc42 documentation |
| M3 | requirements-agent | User stories with Pareto prioritization |
| M4 | cicd-agent | Dockerfile and GitHub Actions pipeline |
| M5 | tdd-bdd-agent | RED-GREEN-REFACTOR implementation |

## License

MIT — see [LICENSE](LICENSE)

## Author

Luka Misojcic

## Documentation

Live documentation site: https://misojca.github.io/sdp-powered-by-ai-agents-luka-misojcic/
