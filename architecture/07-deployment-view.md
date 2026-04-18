# 7. Deployment View

## 7.1 Overview

The system is deployed on AWS using a mix of containerized and managed services.

| Component | AWS Service | Notes |
|-----------|------------|-------|
| React SPA | S3 + CloudFront | Static assets; CDN-distributed |
| API Server | ECS Fargate | Containerized; auto-scaled |
| Notification Worker | ECS Fargate | Separate task definition; scales independently |
| PostgreSQL | RDS PostgreSQL | Multi-AZ for production |
| Redis | ElastiCache (Redis) | Single node for dev; cluster mode for production |
| Book cover images | S3 | Private bucket; pre-signed URLs |
| TLS termination | ALB (Application Load Balancer) | Routes HTTPS to ECS Fargate tasks |
| Secrets | AWS Secrets Manager | DB credentials, Stripe keys, SendGrid API key |

## 7.2 Deployment Diagram

See [`diagrams/07-deployment.puml`](diagrams/07-deployment.puml).

## 7.3 Environments

| Environment | API | DB | Redis | Notes |
|-------------|-----|----|-------|-------|
| Development | Local Docker Compose | Local PostgreSQL container | Local Redis container | No AWS required |
| Staging | ECS Fargate (1 task) | RDS (single-AZ) | ElastiCache (single node) | Mirrors production topology |
| Production | ECS Fargate (auto-scale) | RDS (Multi-AZ) | ElastiCache (cluster) | Full HA setup |

## 7.4 Docker Compose (Development)

```yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    depends_on: [db, redis]
  worker:
    build: .
    command: node src/notifications/worker.js
    depends_on: [redis]
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: bookstore
  redis:
    image: redis:7
```
