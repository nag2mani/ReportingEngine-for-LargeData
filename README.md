# Reporting Engine for Large Data

A scalable, production-ready reporting engine for fee management systems designed to handle millions of records with complex joins, multi-tenant isolation, and fine-grained authorization.

### Key Capabilities Explained

* **Handles millions of records :-**
  Reporting engine is optimized to work efficiently with very large datasets (millions of rows) without performance degradation, ensuring fast query execution even as data grows over time.

* **Supports complex joins :-**
  It can generate reports by combining data from multiple related tables (such as students, fees, payments, classes, and academic years) using advanced SQL joins, filters, and aggregations.

* **Multi-tenant isolation :-**
  A single deployment can serve multiple organizations (tenants), while strictly isolating each tenant’s data so that users can access only their own organization’s records.

* **Fine-grained authorization :-**
  Access control is implemented at a detailed level, allowing permissions to be defined per role, feature, or data scope (e.g., view-only access, department-level data access, or restricted financial visibility).

![1](https://github.com/user-attachments/assets/152316f8-d1ab-4525-a042-bbd483e70c88)

![2](https://github.com/user-attachments/assets/ffd8947d-98ab-47bd-bb54-2161c9e985fa)

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


## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Design Decisions](#design-decisions)
- [Installation & Setup](#installation--setup)
- [Frontend](#frontend)
- [API Documentation](#api-documentation)
- [Authorization System](#authorization-system)
- [Scalability Strategies](#scalability-strategies)
- [AWS Production Deployment](#aws-production-deployment)
- [Docker & Kubernetes](#docker--kubernetes)
- [Testing](#testing)

## Documentation

- **[Documentation](DEVELOPER_GUIDE.md)** - Complete developer guide covering:
  - Running & stopping services
  - Adding more data
  - Modifying existing services
  - Adding new services (backend & frontend)
  - Database management
  - API development
  - Troubleshooting

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

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Cache**: Redis
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: class-validator, class-transformer
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (EKS)

## Design Decisions

### 1. Why PostgreSQL?

- **ACID Compliance**: Critical for financial transactions
- **Complex Joins**: Excellent support for multi-table joins
- **JSONB Support**: Flexible metadata storage
- **Partitioning**: Can partition large tables by `school_id` or date ranges
- **Mature Ecosystem**: Proven at scale

### 2. Why NestJS?

- **Modular Architecture**: Clean separation of concerns
- **TypeScript**: Type safety and better developer experience
- **Decorators**: Elegant implementation of guards and interceptors
- **Dependency Injection**: Testable and maintainable code
- **Built-in Features**: Validation, transformation, caching support

### 3. Authorization Strategy

**Action-Level (RBAC)**:
- Implemented via `PermissionsGuard` that checks role permissions
- Decorator-based: `@RequirePermission(Resource.STUDENTS, Action.READ)`
- Fast lookups via indexed database queries

**Field-Level**:
- Implemented via `FieldMaskInterceptor`
- Filters response objects before sending to client
- Prevents data leaks (PII masking)

**Multi-Tenancy**:
- Automatic scoping via `@CurrentUser()` decorator
- All queries filtered by `user.school_id` (except platform admins)

### 4. Caching Strategy

- **Dashboard Summaries**: Cached for 5 minutes (Redis)
- **Time Series Data**: Cached for 2 minutes
- **Cache Keys**: Include filter parameters and user context
- **Invalidation**: Manual cache clear on data updates (future: event-driven)

### 5. Data Sync Strategy (OLTP → OLAP)

**Option 1: CDC Pipeline (Recommended)**
- Debezium captures Postgres WAL → Kafka → ClickHouse/Redshift
- Near real-time (seconds to minutes latency)
- Handles burst traffic via Kafka buffering

**Option 2: Batch ETL**
- Periodic jobs (5m/15m/hour) reading `updated_at` columns
- Transform and load into OLAP
- Simpler but higher latency

**Current Implementation**: Direct PostgreSQL queries with caching. OLAP integration is a future enhancement.

## Installation & Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis (or use Docker)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd reporting-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL on port 5432
   - Redis on port 6379
   - Application on port 3000 (in development mode)

5. **Run database migrations**
   ```bash
   # Inside the app container or locally
   npm run typeorm:migration:run
   ```

6. **Seed the database**
   ```bash
   # Small scale (5 schools, 100 students each)
   npm run seed -- --scale=small

   # Medium scale (20 schools, 1000 students each)
   npm run seed -- --scale=medium

   # Large scale (100 schools, 2000 students each)
   npm run seed -- --scale=large

   # Custom
   npm run seed -- --schools=10 --students=500 --min-bills=1 --max-bills=2
   ```

7. **Start the application**
   ```bash
   # Development mode (with hot reload)
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

8. **Access the API**
   - Base URL: `http://localhost:3000/api/v1`
   - Health Check: `http://localhost:3000/api/v1/health`

### Default Users

After seeding, you can login with:

- **Platform Admin**: `admin@platform.com` / `password123`
- **School Admin**: `admin@school<id>.com` / `password123`
- **Accountant**: `accountant@school<id>.com` / `password123`

## Frontend

A modern React + TypeScript + Tailwind CSS frontend is included in the `frontend/` directory.

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Features

- **Login Page**: JWT-based authentication
- **Dashboard**: Key metrics, payment summaries, recent transactions
- **Transactions Table**: Sortable, filterable table with field-level permissions
- **Transaction Details**: Complete transaction information page
- **Field-Level Permissions**: UI respects user role permissions (e.g., accountant cannot see student email/phone)

### Default Credentials

- Platform Admin: `admin@platform.com` / `password123`
- School Admin: `admin@school<id>.com` / `password123`
- Accountant: `accountant@school<id>.com` / `password123`

See [frontend/README.md](frontend/README.md) for detailed frontend documentation.

## API Documentation

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@platform.com",
    "name": "Platform Admin",
    "role": "platform_admin",
    "school_id": null
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Reports

#### Get Summary Report
```http
GET /api/v1/reports/summary?school_id=<uuid>&from=2025-01-01&to=2025-01-31&method=upi&period_months=1
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "total_due": 5000000.00,
  "total_collected": 3500000.00,
  "outstanding": 1500000.00,
  "collection_rate": 70.0,
  "method_breakdown": [
    {
      "method": "upi",
      "amount": 2000000.00,
      "count": 5000
    },
    {
      "method": "card",
      "amount": 1500000.00,
      "count": 3000
    }
  ],
  "period": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-01-31T23:59:59.999Z"
  }
}
```

#### Get Time Series Report
```http
GET /api/v1/reports/time-series?school_id=<uuid>&from=2025-01-01&to=2025-01-31&interval=day&method=upi
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "interval": "day",
  "data": [
    {
      "period": "2025-01-01",
      "amount": 100000.00,
      "count": 250
    },
    {
      "period": "2025-01-02",
      "amount": 120000.00,
      "count": 300
    }
  ],
  "period": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-01-31T23:59:59.999Z"
  }
}
```

#### Get Student Report
```http
GET /api/v1/reports/student/:studentId
Authorization: Bearer <access_token>
```

#### Get Top Schools
```http
GET /api/v1/reports/top-schools?limit=10&period_months=1
Authorization: Bearer <access_token>
```

### Students, Fee Bills, Payments

All CRUD endpoints are available. See `postman_collection.json` for complete API documentation.

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

### Usage in Code

```typescript
@Controller('students')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentsController {
  @Get()
  @RequirePermission(Resource.STUDENTS, Action.READ)
  findAll(@CurrentUser() user: any) {
    // Automatically scoped to user.school_id
  }
}
```

## Scalability Strategies

### Database Optimization

1. **Indexing**
   - Composite indexes on `(school_id, student_number)`, `(school_id, due_date)`
   - Partial indexes on status columns
   - Unique indexes on `provider_txn_id`

2. **Partitioning** (Future)
   - Partition `payments` by `school_id` or monthly ranges
   - Partition `fee_bills` by `due_date` (monthly)

3. **Read Replicas**
   - Use read replicas for reporting queries
   - Route analytics to separate read-only connection

4. **Connection Pooling**
   - Configured in TypeORM: `max: 20` connections
   - Use pgbouncer in production for connection multiplexing

### Caching Strategy

- **Dashboard Summaries**: 5-minute TTL
- **Time Series**: 2-minute TTL
- **Cache Keys**: Include all filter parameters
- **Invalidation**: Manual or event-driven (future)

### Query Optimization

- Use `QueryBuilder` for complex joins
- Avoid N+1 queries with `relations` in TypeORM
- Use `select` to limit columns returned
- Pagination on all list endpoints

### Handling Burst Traffic

1. **Kafka Buffering** (Future)
   - Write payments to Kafka first
   - Consumers process and write to PostgreSQL
   - Prevents database overload

2. **Rate Limiting**
   - Configured via `@nestjs/throttler`
   - Default: 100 requests per 60 seconds

3. **Horizontal Scaling**
   - Stateless API allows multiple replicas
   - Kubernetes HPA auto-scales based on CPU/memory

## AWS Production Deployment

### Recommended Services

1. **Compute**: Amazon EKS (Kubernetes)
   - Managed Kubernetes cluster
   - Auto-scaling node groups
   - Spot instances for cost optimization

2. **Database**: Amazon Aurora PostgreSQL
   - Multi-AZ for high availability
   - Read replicas for reporting
   - Automated backups
   - Encryption at rest

3. **Cache**: Amazon ElastiCache (Redis)
   - Cluster mode for high availability
   - Automatic failover
   - Encryption in transit

4. **Streaming**: Amazon MSK (Kafka) or Kinesis Data Streams
   - MSK for Kafka compatibility
   - Kinesis for serverless option

5. **OLAP**: Amazon Redshift or ClickHouse on EC2
   - Redshift for managed analytics
   - ClickHouse for cost-effective self-hosted option

6. **Load Balancer**: Application Load Balancer (ALB)
   - HTTPS termination
   - SSL certificate from ACM
   - Health checks

7. **Storage**: Amazon S3
   - Backup storage
   - ETL snapshots
   - Log archives

8. **Secrets**: AWS Secrets Manager
   - Database credentials
   - JWT secrets
   - API keys

### Configuration Steps

1. **Create EKS Cluster**
   ```bash
   eksctl create cluster --name reporting-engine --region us-east-1 --node-type t3.medium --nodes 3
   ```

2. **Set up Aurora PostgreSQL**
   - Create cluster with 2+ instances (multi-AZ)
   - Enable encryption at rest
   - Configure VPC security groups
   - Create read replica for analytics

3. **Set up ElastiCache Redis**
   - Create cluster mode enabled
   - Configure in same VPC as EKS
   - Enable encryption in transit

4. **Build and Push Docker Image**
   ```bash
   aws ecr create-repository --repository-name reporting-engine
   docker build -t reporting-engine .
   docker tag reporting-engine:latest <account>.dkr.ecr.us-east-1.amazonaws.com/reporting-engine:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/reporting-engine:latest
   ```

5. **Deploy to Kubernetes**
   ```bash
   # Update k8s/configmap.yaml and k8s/secret.yaml with actual values
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl create secret generic reporting-engine-secrets --from-literal=DB_PASSWORD=xxx --from-literal=JWT_SECRET=xxx -n reporting-engine
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/hpa.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

6. **Configure ALB Ingress Controller**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.4.7/docs/install/v2_4_7_full.yaml
   ```

### Production Checklist

- [ ] Enable database encryption at rest
- [ ] Configure VPC security groups (restrict DB access)
- [ ] Set up CloudWatch logging
- [ ] Configure auto-scaling (HPA)
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure backup strategy (daily snapshots)
- [ ] Set up alerting (CloudWatch alarms)
- [ ] Enable WAF on ALB
- [ ] Configure SSL/TLS certificates
- [ ] Set up CI/CD pipeline
- [ ] Configure secrets rotation

## Docker & Kubernetes

### Docker Compose (Local Development)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Kubernetes Deployment

All manifests are in the `k8s/` directory:

- `namespace.yaml`: Kubernetes namespace
- `configmap.yaml`: Application configuration
- `secret.yaml`: Sensitive data (update with actual values)
- `deployment.yaml`: Application deployment (3 replicas)
- `service.yaml`: ClusterIP service
- `hpa.yaml`: Horizontal Pod Autoscaler (3-10 replicas)
- `ingress.yaml`: ALB Ingress for external access

**Deploy:**
```bash
kubectl apply -f k8s/
```

## Testing

### Postman Collection

Import `postman_collection.json` into Postman:

1. **Import Collection**: File → Import → Select `postman_collection.json`
2. **Set Variables**: Update `base_url` if needed
3. **Login**: Run "Authentication → Login" to get tokens
4. **Test APIs**: All endpoints are ready to use

### Manual Testing

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"password123"}'

# Get summary (replace TOKEN)
curl http://localhost:3000/api/v1/reports/summary \
  -H "Authorization: Bearer <TOKEN>"
```

## Project Structure

```
reporting-engine/
├── src/
│   ├── entities/          # TypeORM entities
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── students/     # Student CRUD
│   │   ├── fees/         # Fee bill CRUD
│   │   ├── payments/     # Payment CRUD
│   │   ├── reports/      # Reporting endpoints
│   │   └── health/       # Health check
│   ├── common/           # Shared code
│   │   ├── guards/       # Auth & permission guards
│   │   ├── interceptors/ # Field masking, audit logging
│   │   ├── decorators/   # Custom decorators
│   │   └── dto/          # Shared DTOs
│   ├── config/           # Configuration
│   ├── app.module.ts     # Root module
│   └── main.ts           # Entry point
├── scripts/
│   └── seed.ts           # Database seeding script
├── k8s/                  # Kubernetes manifests
├── docker-compose.yml    # Local development
├── Dockerfile            # Production image
├── postman_collection.json
└── README.md
```

## Assumptions & Guesstimates

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

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U postgres -d reporting_engine
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Application Issues

```bash
# View logs
docker-compose logs -f app

# Restart application
docker-compose restart app
```

---

**Built with ❤️ by Nagmani using NestJS, TypeScript, PostgreSQL, and Redis**
