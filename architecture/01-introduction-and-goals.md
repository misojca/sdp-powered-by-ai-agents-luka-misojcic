# 1. Introduction and Goals

## 1.1 Purpose

The Online Bookstore is an e-commerce platform where customers can browse, search, and purchase books. It supports user registration, book catalog management, shopping cart, order processing, and email notifications.

## 1.2 Goals

| ID | Goal |
|----|------|
| G-01 | Customers can register, log in, and manage their profile |
| G-02 | Customers can browse, search, and filter the book catalog |
| G-03 | Customers can manage a shopping cart and place orders |
| G-04 | Orders are processed with secure payment via Stripe |
| G-05 | Customers receive email notifications on order events via SendGrid |
| G-06 | Admins can manage book inventory and view orders |

## 1.3 Stakeholders

| Role | Concern |
|------|---------|
| Customer | Browse catalog, manage cart, place orders, receive confirmations |
| Store Admin | Manage books and stock, monitor orders |
| Stripe | Receive payment requests, return transaction results |
| SendGrid | Deliver transactional emails |
| Development Team | Clear module boundaries, testability, maintainability |
| Operations Team | Deployability on AWS, observability, cost efficiency |

## 1.4 Bounded Contexts

| Context | Responsibility |
|---------|---------------|
| **Users** | Registration, authentication, profiles |
| **Catalog** | Books, authors, categories, stock levels |
| **Orders** | Shopping cart, order placement, order lifecycle |
| **Payment** | Stripe integration, payment confirmation, refunds |
| **Notifications** | Email dispatch via SendGrid, triggered by order events |

## 1.5 Quality Goals

| Priority | Quality Attribute | Scenario |
|----------|------------------|----------|
| 1 | Security | Payment handled exclusively via Stripe; no card data touches our systems |
| 2 | Data Consistency | Stock decremented atomically on order confirmation; no overselling |
| 3 | Availability | Platform uptime ≥ 99.5%; async email delivery does not block order flow |
| 4 | Performance | Catalog search < 500ms p95; Redis caching for hot catalog data |
| 5 | Maintainability | Each bounded context is an independent Express router + service module |

## 1.6 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React |
| API | Node.js + Express |
| Database | PostgreSQL |
| Cache / Queue | Redis |
| Payments | Stripe |
| Email | SendGrid |
| Deployment | AWS (serverless + containers) |
