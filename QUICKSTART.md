# Quick Start Guide

Get the Reporting Engine up and running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (optional, for local development)

## Steps

### 1. Clone and Setup

```bash
git clone <repo-url>
cd reporting-engine
cp .env.example .env
```

### 2. Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Application (port 3000)

### 3. Initialize Database

```bash
# Option A: Using Docker
docker-compose exec app npm run typeorm:migration:run

# Option B: Locally (if you have Node.js installed)
npm install
npm run typeorm:migration:run
```

**Note**: In development mode, TypeORM `synchronize: true` will auto-create tables. For production, use migrations.

### 4. Seed Database

```bash
# Small scale (recommended for first run)
docker-compose exec app npm run seed -- --scale=small

# Or locally
npm run seed -- --scale=small
```

This creates:
- 5 schools
- 500 students (100 per school)
- Fee bills and payments
- Default users

### 5. Test the API

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"password123"}'
```

### 6. Import Postman Collection

1. Open Postman
2. Import → File → Select `postman_collection.json`
3. Run "Authentication → Login" to get tokens
4. Test all endpoints!

## Default Credentials

- **Platform Admin**: `admin@platform.com` / `password123`
- **School Admin**: `admin@school<id>.com` / `password123`
- **Accountant**: `accountant@school<id>.com` / `password123`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints in Postman
- Check out the architecture and design decisions
- Review AWS deployment guide for production setup

## Troubleshooting

**Port already in use?**
```bash
# Change ports in docker-compose.yml
ports:
  - "5433:5432"  # PostgreSQL
  - "6380:6379"  # Redis
  - "3001:3000"  # App
```

**Database connection error?**
```bash
# Wait for PostgreSQL to be ready
docker-compose logs postgres

# Check if services are running
docker-compose ps
```

**Need to reset everything?**
```bash
docker-compose down -v  # Removes volumes
docker-compose up -d
npm run seed -- --scale=small
```

## Development Mode

To run locally without Docker:

```bash
# Start PostgreSQL and Redis separately, or use Docker for just these
docker-compose up -d postgres redis

# Run app locally
npm install
npm run start:dev
```

Happy coding! 🚀
