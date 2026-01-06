# API Documentation

Complete API reference for the Reporting Engine application. For a complete list of all endpoints with examples, **import the postman_collection.json file into Postman.**

<img width="1465" height="841" alt="Screenshot 2025-12-19 at 9 12 21 AM" src="https://github.com/user-attachments/assets/77744e5a-66df-4508-8b22-fc6f76d03479" />

## Table of Contents

1. [Authentication](#authentication)
   - [Login](#login)
   - [Refresh Token](#refresh-token)
2. [Reports](#reports)
   - [Get Summary Report](#get-summary-report)
   - [Get Time Series Report](#get-time-series-report)
   - [Get Student Report](#get-student-report)
   - [Get Top Schools](#get-top-schools)
3. [Students, Fee Bills, Payments](#students-fee-bills-payments)

---

## Authentication

### Login
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

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Reports

### Get Summary Report
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

### Get Time Series Report
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

### Get Student Report
```http
GET /api/v1/reports/student/:studentId
Authorization: Bearer <access_token>
```

### Get Top Schools
```http
GET /api/v1/reports/top-schools?limit=10&period_months=1
Authorization: Bearer <access_token>
```

## Students, Fee Bills, Payments

All CRUD endpoints are available. See `postman_collection.json` for complete API documentation.

### Base URL

All API endpoints are prefixed with `/api/v1`.

### Authentication

Most endpoints require authentication via JWT Bearer token. Include the token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Response Format

All successful responses follow this format:

```json
{
  "data": { ... },
  "message": "Success" // optional
}
```

Error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Pagination

List endpoints support pagination via query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Paginated responses include:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### Complete API Reference

Import the `postman_collection.json` file into Postman and you will get all endpoints with examples.


