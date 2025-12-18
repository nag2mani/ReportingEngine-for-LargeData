# Reporting Engine for Large Data

A scalable, production-ready reporting engine for fee management systems designed to handle millions of records with complex joins, multi-tenant isolation, and fine-grained authorization.

### Platform Admin Dashboard
<img width="1359" height="619" alt="Screenshot 2025-12-17 at 10 38 11 PM" src="https://github.com/user-attachments/assets/0faff57e-5ef3-43cb-a37d-5afbfd2c9d03" />

### School Admin Dashboard
<img width="1333" height="713" alt="Screenshot 2025-12-17 at 10 38 45 PM" src="https://github.com/user-attachments/assets/96c5289b-d009-45a7-8970-f0731027150b" />


## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Design Decisions](DESIGN_DECISION.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Authorization System](#authorization-system)
- [Scalability Strategies](DESIGN_DECISION.md#scalability-strategies)
- [AWS Production Deployment](DEVELOPER_GUIDE.md#aws-production-deployment)
- [Docker & Kubernetes](DEVELOPER_GUIDE.md#docker--kubernetes)


## Overview

This reporting engine is designed for a platform supporting **1000 schools** with:
- **2,000,000+ students** (2000 per school average)
- **Millions of fee bills and transactions**
- **Real-time dashboard reporting** with filtering capabilities
- **Multi-tenant isolation** by school
- **Action-level and field-level authorization**

### Key Capabilities

1. **Dashboard Reporting**: Summary reports on total fees due, collected, outstanding with filtering by time, student, and payment method
2. **Scalable Architecture**: Handles millions of records with optimized queries, caching, and partitioning strategies
3. **Authorization**: RBAC with action-level and field-level permissions
4. **Multi-tenant**: Secure data isolation by school
5. **Real-time Analytics**: Cached reports with Redis for fast dashboard loads

## Quick Start

```bash
# 1. Start database services
docker-compose up -d postgres redis

# 2. Install dependencies
npm install && cd frontend && npm install && cd ..

# 3. Seed database
npm run seed -- --scale=small

# 4. Start backend
./scripts/backend-control.sh start

# 5. Start frontend (new terminal)
cd frontend && npm run dev
```

Open http://localhost:5173 and login with `admin@platform.com` / `password123`


## Documentation

- **[Documentation](DEVELOPER_GUIDE.md)** - Complete developer guide covering:
  - Running & stopping services
  - Adding more data
  - Modifying existing services
  - Adding new services (backend & frontend)
  - Database management
  - API development
  - Troubleshooting


## Project Structure

```
ReportingEngine-for-LargeData/
├── src/                          # Backend source code
│   ├── entities/                 # TypeORM database entities
│   │   ├── audit-log.entity.ts
│   │   ├── fee-bill.entity.ts
│   │   ├── field-permission.entity.ts
│   │   ├── payment.entity.ts
│   │   ├── permission.entity.ts
│   │   ├── role.entity.ts
│   │   ├── school.entity.ts
│   │   ├── student.entity.ts
│   │   ├── transaction-status.entity.ts
│   │   └── user.entity.ts
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   └── strategies/
│   │   ├── students/             # Student CRUD operations
│   │   ├── fees/                 # Fee bill management
│   │   ├── payments/             # Payment processing
│   │   ├── reports/              # Reporting endpoints
│   │   └── health/               # Health check endpoint
│   ├── common/                   # Shared code
│   │   ├── guards/               # Auth & permission guards
│   │   ├── interceptors/         # Field masking, audit logging
│   │   ├── decorators/           # Custom decorators
│   │   └── dto/                  # Shared DTOs
│   ├── config/                   # Configuration modules
│   ├── app.module.ts             # Root module
│   └── main.ts                   # Application entry point
├── frontend/                     # Frontend React application
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   │   ├── Layout.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── TransactionsTable.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Transactions.tsx
│   │   │   └── TransactionDetail.tsx
│   │   ├── services/             # API service layer
│   │   │   └── api.ts
│   │   ├── context/              # React context providers
│   │   │   └── AuthContext.tsx
│   │   ├── types/                # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── utils/                # Utility functions
│   │   │   ├── format.ts
│   │   │   └── permissions.ts
│   │   ├── App.tsx               # Main app component
│   │   ├── main.tsx              # Frontend entry point
│   │   └── index.css             # Global styles
│   ├── public/                   # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── scripts/                      # Utility scripts
│   ├── seed.ts                   # Database seeding script
│   ├── backend-control.sh        # Backend service control
│   ├── frontend-control.sh       # Frontend service control
│   └── list-users.ts             # User listing utility
├── k8s/                          # Kubernetes deployment manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml                  # Horizontal Pod Autoscaler
│   └── ingress.yaml
├── docker-compose.yml            # Local development services
├── Dockerfile                    # Production Docker image
├── postman_collection.json       # API testing collection
├── DATABASE_SCHEMA.md            # Database schema documentation
├── DEVELOPER_GUIDE.md            # Developer guide
└── README.md                     # This file
```

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      NestJS API Layer           │
│  (Auth, Guards, Interceptors)   │
└──────┬───────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ PostgreSQL  │   │   Redis     │   │   Kafka     │
│   (OLTP)    │   │   (Cache)   │   │  (Streams)  │
└─────────────┘   └─────────────┘   └─────────────┘
       │
       ▼
┌─────────────┐
│ ClickHouse  │
│   (OLAP)    │
└─────────────┘
```

### Component Breakdown

1. **API Layer (NestJS)**: RESTful API with JWT authentication, RBAC guards, field-level interceptors
2. **OLTP Database (PostgreSQL)**: Primary transactional database with optimized indexes and partitioning
3. **Cache Layer (Redis)**: Caching for dashboard summaries and frequently accessed data
4. **Streaming (Kafka)**: Optional - for handling burst traffic and CDC
5. **OLAP Database (ClickHouse/Redshift)**: For heavy analytical queries (future enhancement)

## Database Schema

For detailed database schema documentation, see **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)**.

The database schema includes:

- **Core Tables**: `schools`, `students`, `fee_bills`, `payments`, `transaction_status`
- **Authorization Tables**: `users`, `roles`, `permissions`, `field_permissions`, `audit_logs`
- **Indexing Strategy**: Composite and single-column indexes for optimal query performance
- **Multi-Tenancy**: Row-level isolation using `school_id` for secure data separation

## Features

### 1. Dashboard Reporting

- **Summary Report**: Total fees due, collected, outstanding with collection rate
- **Time Series Report**: Daily/weekly/monthly collection trends
- **Student Report**: Complete fee bill and payment history for a student
- **Top Schools Report**: Schools ranked by collection amounts
- **Filtering**: By school, student, date range, payment method

### 2. Authorization System

#### Action-Level (RBAC)
- **Roles**: `platform_admin`, `school_admin`, `accountant`, `teacher`, `readonly`
- **Resources**: `students`, `fee_bills`, `payments`, `reports`, `schools`, `users`
- **Actions**: `read`, `create`, `update`, `delete`

#### Field-Level Permissions
- Mask sensitive fields (e.g., accountant cannot see student email/phone)
- Implemented via interceptors that filter response objects

#### Multi-Tenant Isolation
- Non-platform admins are automatically scoped to their `school_id`
- All queries filtered by user's school context

### 3. Scalability Features

- **Database Indexing**: Strategic indexes on frequently queried columns
- **Redis Caching**: Dashboard summaries cached for 2-5 minutes
- **Query Optimization**: Efficient joins and aggregations
- **Pagination**: All list endpoints support pagination
- **Connection Pooling**: TypeORM connection pool configuration

## Technology Stack

### Backend
- **Framework**: NestJS 10.3.0 (TypeScript 5.3.3)
- **Runtime**: Node.js
- **HTTP Server**: Express (via @nestjs/platform-express)
- **ORM**: TypeORM 0.3.17
- **Authentication**: JWT (access + refresh tokens) via @nestjs/jwt
- **Rate Limiting**: @nestjs/throttler
- **Caching**: @nestjs/cache-manager

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router v6.21.0
- **HTTP Client**: Axios 1.6.2
- **Styling**: Tailwind CSS 3.3.6

### Infrastructure & DevOps
- **Containerization**: 
  - Docker
  - Docker Compose
- **Orchestration**: Kubernetes (EKS)
- **Database**: PostgreSQL 15 (Alpine)
- **Cache**: Redis 7 (Alpine)
- **CI/CD**: (Configurable - GitHub Actions, GitLab CI, etc.)
- **Cloud Platform**: AWS (EKS, Aurora, ElastiCache, etc.)

## Authorization System

### Roles & Permissions

| Role | Students | Fee Bills | Payments | Reports | Schools | Users |
|------|----------|-----------|----------|---------|---------|-------|
| platform_admin | CRUD | CRUD | CRUD | R | CRUD | CRUD |
| school_admin | CRUD | CRUD | CRUD | R | - | - |
| accountant | - | CRU | CRU | R | - | - |
| teacher | R | - | - | R | - | - |
| readonly | R | R | R | R | R | R |

**Note**: Accountant cannot see student email/phone (field-level masking).

## Assumptions & Performance Targets

### Data Volume Assumptions

- **1000 schools** (target platform scale)
- **2000 students per school** (average) = 2,000,000 students
- **1.2 fee bills per student per year** = 2,400,000 fee bills/year
- **Daily transactions**: 2K sustained, 10K peak bursts
- **Payment methods**: UPI (40%), Card (30%), Cash (20%), Others (10%)

### Performance Targets

- **Dashboard Summary**: < 500ms (with cache), < 2s (without cache)
- **Time Series Report**: < 1s (with cache), < 5s (without cache)
- **Student Report**: < 200ms
- **API Response Time**: P95 < 1s, P99 < 3s

## Future Enhancements

1. **OLAP Integration**: ClickHouse/Redshift for heavy analytics
2. **CDC Pipeline**: Debezium → Kafka → OLAP for real-time sync
3. **Materialized Views**: Pre-aggregated dashboard data
4. **GraphQL API**: For flexible frontend queries
5. **WebSocket Support**: Real-time dashboard updates
6. **Export Functionality**: PDF/Excel report generation
7. **Advanced Analytics**: ML-based predictions, anomaly detection
8. **Multi-language Support**: i18n for international schools

---

**Built with ❤️ by Nagmani & CursorAI Using NestJS, TypeScript, PostgreSQL, and Redis**