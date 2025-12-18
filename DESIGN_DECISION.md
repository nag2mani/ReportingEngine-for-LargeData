# Design Decisions

This document outlines the key design decisions and architectural choices made in the Reporting Engine application.

## Table of Contents

1. [Why PostgreSQL?](#why-postgresql)
2. [Why NestJS?](#why-nestjs)
3. [Authorization Strategy](#authorization-strategy)
4. [Caching Strategy](#caching-strategy)
5. [Data Sync Strategy (OLTP → OLAP)](#data-sync-strategy-oltp--olap)
6. [Scalability Strategies](#scalability-strategies)

---

## Why PostgreSQL?

- **ACID Compliance**: Critical for financial transactions
- **Complex Joins**: Excellent support for multi-table joins
- **JSONB Support**: Flexible metadata storage
- **Partitioning**: Can partition large tables by `school_id` or date ranges
- **Mature Ecosystem**: Proven at scale

## Why NestJS?

- **Modular Architecture**: Clean separation of concerns
- **TypeScript**: Type safety and better developer experience
- **Decorators**: Elegant implementation of guards and interceptors
- **Dependency Injection**: Testable and maintainable code
- **Built-in Features**: Validation, transformation, caching support

## Authorization Strategy

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
- Row-level isolation at database level using `school_id` column
- See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md#multi-tenancy) for database implementation details

## Caching Strategy

- **Dashboard Summaries**: Cached for 5 minutes (Redis)
- **Time Series Data**: Cached for 2 minutes
- **Cache Keys**: Include filter parameters and user context
- **Invalidation**: Manual cache clear on data updates (future: event-driven)

## Data Sync Strategy (OLTP → OLAP)

**Option 1: CDC Pipeline (Recommended)**
- Debezium captures Postgres WAL → Kafka → ClickHouse/Redshift
- Near real-time (seconds to minutes latency)
- Handles burst traffic via Kafka buffering

**Option 2: Batch ETL**
- Periodic jobs (5m/15m/hour) reading `updated_at` columns
- Transform and load into OLAP
- Simpler but higher latency

**Current Implementation**: Direct PostgreSQL queries with caching. OLAP integration is a future enhancement.

## Scalability Strategies

### Database Optimization

1. **Indexing**
   - Strategic composite and single-column indexes for common query patterns
   - See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md#indexing-strategy) for detailed indexing strategy

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