# Developer Guide - Reporting Engine

Complete guide for developing, running, and extending the Reporting Engine application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Running & Stopping Services](#running--stopping-services)
3. [Adding More Data](#adding-more-data)
4. [Modifying Existing Services](#modifying-existing-services)
5. [Adding New Services (Backend)](#adding-new-services-backend)
6. [Adding New Services (Frontend)](#adding-new-services-frontend)
7. [Database Management](#database-management)
8. [API Development](#api-development)
9. [Frontend Development](#frontend-development)
10. [Testing & Troubleshooting](#testing--troubleshooting)
11. [AWS Production Deployment](#aws-production-deployment)

---

## Quick Start

Get the Reporting Engine up and running in 5 minutes!

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (optional, for local development)
- npm or yarn

### Option 1: Docker Compose Setup (Recommended for Quick Start)

```bash
# 1. Clone and setup
git clone <repo-url>
cd ReportingEngine-for-LargeData
cp .env.example .env

# 2. Start all services (PostgreSQL, Redis, and Application)
docker-compose up -d

# This starts:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - Application (port 3000)

# 3. Initialize Database
# Option A: Using Docker
docker-compose exec app npm run typeorm:migration:run

# Option B: Locally (if you have Node.js installed)
npm install
npm run typeorm:migration:run

# Note: In development mode, TypeORM synchronize: true will auto-create tables.
# For production, use migrations.

# 4. Seed Database
# Small scale (recommended for first run)
docker-compose exec app npm run seed -- --scale=small

# Or locally
npm run seed -- --scale=small

# This creates:
# - 5 schools
# - 500 students (100 per school)
# - Fee bills and payments
# - Default users

# 5. Test the API
# Health check
curl http://localhost:3000/api/v1/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"password123"}'

# 6. Import Postman Collection
# 1. Open Postman
# 2. Import → File → Select postman_collection.json
# 3. Run "Authentication → Login" to get tokens
# 4. Test all endpoints!
```

### Option 2: Local Development Setup

```bash
# 1. Clone and navigate to project
cd ReportingEngine-for-LargeData
cp .env.example .env

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Start database services (PostgreSQL & Redis)
docker-compose up -d postgres redis

# 5. Wait for services to be ready (10-15 seconds)
sleep 10

# 6. Seed the database
npm run seed -- --scale=small

# 7. Start backend
./scripts/backend-control.sh start

# 8. Start frontend (in a new terminal)
cd frontend
npm run dev
```

### Development Mode (Local without Docker for App)

To run the application locally while using Docker only for PostgreSQL and Redis:

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run app locally
npm install
npm run start:dev
```

### Next Steps

After getting the application running:

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints in Postman
- Check out the architecture and design decisions
- Review deployment guides for production setup
- See the [Running & Stopping Services](#running--stopping-services) section for daily development workflow

---

## Running & Stopping Services

### 🚀 Start Everything (Quick)

```bash
# 1. Start database
docker-compose up -d postgres redis

# 2. Start backend
./scripts/backend-control.sh start

# 3. Start frontend (new terminal)
cd frontend && npm run dev
```

### 🛑 Stop Everything (Quick)

```bash
# Stop backend
./scripts/backend-control.sh stop

# Stop frontend
./scripts/frontend-control.sh stop
# OR Press Ctrl+C in frontend terminal

# Stop database
docker-compose stop postgres redis
```

### Backend Control

#### Using the Control Script (Recommended)

```bash
# Start backend
./scripts/backend-control.sh start

# Stop backend
./scripts/backend-control.sh stop

# Restart backend
./scripts/backend-control.sh restart

# Check status
./scripts/backend-control.sh status

# View logs
./scripts/backend-control.sh logs
```

#### Manual Backend Control

```bash
# Start (Development Mode)
cd ReportingEngine-for-LargeData
NODE_ENV=development npm run start:dev

# Start (Production Mode)
npm run build
npm run start:prod

# Stop (Kill Process)
pkill -f "nest start"
# Or kill by port
lsof -ti:3000 | xargs kill -9

# Check if running
curl http://localhost:3000/api/v1/health
```

### Frontend Control

```bash
# Start frontend (Development)
cd frontend
npm run dev

# Stop frontend (Method 1 - Using script)
./scripts/frontend-control.sh stop

# Stop frontend (Method 2 - Manual)
# Press Ctrl+C in the terminal where frontend is running

# Stop frontend (Method 3 - Kill by port)
lsof -ti:5173 | xargs kill -9

# Check frontend status
./scripts/frontend-control.sh status

# Build for production
cd frontend
npm run build

# Preview production build
npm run preview
```

### Database Services (Docker)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Stop database services
docker-compose stop postgres redis

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Check status
docker-compose ps
```

### All Services at Once

```bash
# Start everything
docker-compose up -d postgres redis
./scripts/backend-control.sh start
cd frontend && npm run dev &

# Stop everything
./scripts/backend-control.sh stop
docker-compose stop
pkill -f "vite"
```

### 🔍 Check Status

```bash
# Backend health
curl http://localhost:3000/api/v1/health

# Frontend
curl http://localhost:5173

# Database
docker-compose ps
```

---

## Adding More Data

### 📊 Seeding Database (Quick Reference)

```bash
# Seed database (small scale)
npm run seed -- --scale=small

# Seed database (custom)
npm run seed -- --schools=10 --students=500
```

### Seeding Database

The seed script supports different scales and custom options:

```bash
# Small scale (5 schools, 100 students each)
npm run seed -- --scale=small

# Medium scale (20 schools, 1000 students each)
npm run seed -- --scale=medium

# Large scale (100 schools, 2000 students each)
npm run seed -- --scale=large

# Custom scale
npm run seed -- --schools=10 --students=500 --min-bills=1 --max-bills=3
```

### Seed Script Options

```bash
npm run seed -- \
  --schools=50 \           # Number of schools
  --students=2000 \        # Students per school
  --min-bills=1 \          # Minimum fee bills per student
  --max-bills=3            # Maximum fee bills per student
```

### Adding Data Manually

#### Using API

For complete API endpoint documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

Quick examples:

```bash
# Create a student
curl -X POST http://localhost:3000/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": "SCHOOL_UUID",
    "student_number": "STU001",
    "first_name": "John",
    "last_name": "Doe",
    "class": "10",
    "section": "A"
  }'

# Create a fee bill
curl -X POST http://localhost:3000/api/v1/fee-bills \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": "SCHOOL_UUID",
    "student_id": "STUDENT_UUID",
    "amount_due": 25000,
    "due_date": "2025-02-01",
    "period": "2025-02"
  }'

# Create a payment
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": "SCHOOL_UUID",
    "student_id": "STUDENT_UUID",
    "fee_bill_id": "FEE_BILL_UUID",
    "amount_paid": 25000,
    "method": "upi",
    "status": "success"
  }'
```

#### Using Database Directly

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d reporting_engine

# Example: Insert a school
INSERT INTO schools (id, name, timezone, region, created_at)
VALUES (gen_random_uuid(), 'New School', 'Asia/Kolkata', 'North', NOW());
```

---

## Modifying Existing Services

### Backend Services

#### 1. Modify a Service

**Example: Adding a new method to ReportsService**

```typescript
// src/modules/reports/reports.service.ts

@Injectable()
export class ReportsService {
  // ... existing code ...

  // Add new method
  async getAgingReport(filter: ReportFilterDto, userSchoolId?: string) {
    const schoolId = userSchoolId || filter.school_id;
    const fromDate = filter.from ? new Date(filter.from) : new Date();
    fromDate.setMonth(fromDate.getMonth() - 6); // Last 6 months

    // Your implementation here
    const query = this.feeBillRepository
      .createQueryBuilder('fb')
      .select('fb.status', 'status')
      .addSelect('COUNT(fb.id)', 'count')
      .addSelect('SUM(fb.amount_due)', 'total')
      .where('fb.school_id = :schoolId', { schoolId })
      .groupBy('fb.status');

    return query.getRawMany();
  }
}
```

#### 2. Add New Endpoint to Controller

```typescript
// src/modules/reports/reports.controller.ts

@Get('aging')
@RequirePermission(Resource.REPORTS, Action.READ)
async getAgingReport(
  @Query() filter: ReportFilterDto,
  @CurrentUser() user: any,
) {
  return this.reportsService.getAgingReport(filter, user.school_id);
}
```

#### 3. Update DTOs

```typescript
// src/modules/reports/dto/report-filter.dto.ts

export class ReportFilterDto {
  // ... existing fields ...

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  aging_months?: number; // New field
}
```

### Frontend Services

#### 1. Add New API Method

```typescript
// frontend/src/services/api.ts

class ApiService {
  // ... existing methods ...

  async getAgingReport(filters?: {
    school_id?: string;
    student_id?: string;
    aging_months?: number;
  }): Promise<any> {
    const response = await this.client.get('/reports/aging', {
      params: filters,
    });
    return response.data;
  }
}
```

#### 2. Add New Page/Component

```typescript
// frontend/src/pages/AgingReport.tsx

import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiService } from '../services/api';

export function AgingReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await apiService.getAgingReport({ aging_months: 6 });
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Aging Report</h1>
        {/* Your UI here */}
      </div>
    </Layout>
  );
}
```

#### 3. Add Route

```typescript
// frontend/src/App.tsx

import { AgingReport } from './pages/AgingReport';

// In Routes:
<Route
  path="/reports/aging"
  element={
    <ProtectedRoute>
      <AgingReport />
    </ProtectedRoute>
  }
/>
```

---

## Adding New Services (Backend)

### Step-by-Step: Create a New Module

#### 1. Create Entity (if needed)

```typescript
// src/entities/notification.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
@Index(['user_id', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

#### 2. Create DTOs

```typescript
// src/modules/notifications/dto/create-notification.dto.ts

import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
```

#### 3. Create Service

```typescript
// src/modules/notifications/notifications.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }
}
```

#### 4. Create Controller

```typescript
// src/modules/notifications/notifications.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import { Resource, Action } from '../../entities/permission.entity';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @RequirePermission(Resource.USERS, Action.CREATE)
  create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Get()
  @RequirePermission(Resource.USERS, Action.READ)
  findAll(@CurrentUser() user: any) {
    return this.notificationsService.findAll(user.id);
  }

  @Patch(':id/read')
  @RequirePermission(Resource.USERS, Action.UPDATE)
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
```

#### 5. Create Module

```typescript
// src/modules/notifications/notifications.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../../entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

#### 6. Register in App Module

```typescript
// src/app.module.ts

import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ... existing modules ...
    NotificationsModule,
  ],
})
export class AppModule {}
```

#### 7. Update Database Config

```typescript
// src/config/database.module.ts

import { Notification } from '../entities/notification.entity';

// Add to entities array:
entities: [
  // ... existing entities ...
  Notification,
],
```

---

## Adding New Services (Frontend)

### Step-by-Step: Create New Feature

#### 1. Add API Method

```typescript
// frontend/src/services/api.ts

import { Notification } from '../types';

class ApiService {
  // ... existing methods ...

  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get<Notification[]>('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }
}
```

#### 2. Add Types

```typescript
// frontend/src/types/index.ts

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
```

#### 3. Create Component

```typescript
// frontend/src/components/Notifications.tsx

import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Notification } from '../types';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border ${
            notification.is_read
              ? 'bg-gray-50 border-gray-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{notification.title}</h3>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            {!notification.is_read && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### 4. Add to Layout or Page

```typescript
// frontend/src/components/Layout.tsx

import { Notifications } from './Notifications';

export function Layout({ children }: LayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div>
      <header>
        {/* ... existing header ... */}
        <button onClick={() => setShowNotifications(!showNotifications)}>
          <Bell className="w-5 h-5" />
        </button>
      </header>
      {showNotifications && <Notifications />}
      <main>{children}</main>
    </div>
  );
}
```

---

## Database Management

### Migrations

```bash
# Generate migration
npm run typeorm:migration:generate -- -n MigrationName

# Run migrations
# Option A: Using Docker
docker-compose exec app npm run typeorm:migration:run

# Option B: Locally
npm run typeorm:migration:run

# Revert last migration
npm run typeorm:migration:revert
```

**Note**: In development mode, TypeORM `synchronize: true` will auto-create tables. For production, use migrations.

### Database Queries

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d reporting_engine

# Common queries
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM payments WHERE status = 'success';
SELECT school_id, SUM(amount_paid) FROM payments GROUP BY school_id;
```

### Backup & Restore

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres reporting_engine > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres reporting_engine < backup.sql
```

---

## API Development

For complete API documentation including all endpoints, request/response formats, authentication, and examples, see **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)**.

### Quick Testing

#### Using Postman (Recommended)

1. Open Postman
2. Import → File → Select `postman_collection.json`
3. Run "Authentication → Login" to get token
4. Token is automatically saved to collection variable
5. Test all endpoints!

#### Using curl

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"password123"}'

# Get summary (replace TOKEN with access_token from login)
curl http://localhost:3000/api/v1/reports/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For more API examples and complete endpoint documentation, refer to [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## Frontend Development

### Adding New Routes

```typescript
// frontend/src/App.tsx

import { NewPage } from './pages/NewPage';

<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### Styling with Tailwind

```typescript
// Utility classes
<div className="bg-white rounded-lg shadow-md p-6">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <p className="text-gray-600">Description</p>
</div>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### State Management

```typescript
// Using useState
const [data, setData] = useState(null);

// Using Context (for global state)
import { useAuth } from '../context/AuthContext';
const { user } = useAuth();
```

### Form Handling

```typescript
import { useState } from 'react';

function MyForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createSomething(formData);
      toast.success('Created successfully');
    } catch (error) {
      toast.error('Failed to create');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Default Credentials

After seeding the database, you can use these credentials:

### Platform Admin
- **Email**: `admin@platform.com`
- **Password**: `password123`
- **Role**: Platform Administrator with full access

### School Admins

The seed script creates school admin users for the first 10 schools. Here are the credentials:

1. `admin@schoole05f6593.com` / `password123` (School 1)
2. `admin@school386b52db.com` / `password123` (School 2)
3. `admin@schooldf216246.com` / `password123` (School 3)
4. `admin@schooled2e84fa.com` / `password123` (School 4)
5. `admin@schoola47b789e.com` / `password123` (School 5)
6. `admin@school96f60369.com` / `password123` (School 6)
7. `admin@school0ea536c7.com` / `password123` (School 7)
8. `admin@school4eec2c24.com` / `password123` (School 8)
9. `admin@school5da29965.com` / `password123` (School 9)
10. `admin@schoolfb852efc.com` / `password123` (School 10)

### Accountants

The seed script creates accountant users for the first 10 schools. Here are the credentials:

1. `accountant@schoole05f6593.com` / `password123` (School 1)
2. `accountant@school386b52db.com` / `password123` (School 2)
3. `accountant@schooldf216246.com` / `password123` (School 3)
4. `accountant@schooled2e84fa.com` / `password123` (School 4)
5. `accountant@schoola47b789e.com` / `password123` (School 5)
6. `accountant@school96f60369.com` / `password123` (School 6)
7. `accountant@school0ea536c7.com` / `password123` (School 7)
8. `accountant@school4eec2c24.com` / `password123` (School 8)
9. `accountant@school5da29965.com` / `password123` (School 9)
10. `accountant@schoolfb852efc.com` / `password123` (School 10)

### Getting All User Credentials

To list all available user credentials (including all schools and users), run:

```bash
npm run list-users
```

This command will display:
- Platform admin credentials
- All school admin credentials (grouped by school)
- All accountant credentials (grouped by school)
- A summary table with all users
- Total counts of users and schools

**Note**: The email format uses the first 8 characters of each school's UUID. If you seed the database with different options or re-seed, the school IDs will be different, so use `npm run list-users` to get the current credentials.

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/api/v1/health

## Testing & Troubleshooting

### Postman Collection

Import `postman_collection.json` into Postman:

1. **Import Collection**: File → Import → Select `postman_collection.json`
2. **Set Variables**: Update `base_url` if needed
3. **Login**: Run "Authentication → Login" to get tokens
4. **Test APIs**: All endpoints are ready to use

### Manual Testing

For complete API testing examples and endpoint documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

Quick health check:
```bash
curl http://localhost:3000/api/v1/health
```

### 🐛 Quick Troubleshooting Commands

```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Clear and reinstall
rm -rf node_modules dist
npm install
cd frontend && rm -rf node_modules && npm install
```

### Backend Issues

#### Backend won't start

```bash
# Check for port conflicts
lsof -i:3000

# Check logs
./scripts/backend-control.sh logs

# Check TypeScript errors
npm run build

# Clear and reinstall
rm -rf node_modules dist
npm install
```

#### Database connection errors

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U postgres -d reporting_engine -c "SELECT 1;"

# Restart database
docker-compose restart postgres

# Wait for PostgreSQL to be ready
docker-compose logs postgres

# Check if services are running
docker-compose ps
```

#### Port already in use (Docker)

If ports are already in use, you can change them in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # PostgreSQL (change from 5432)
  - "6380:6379"  # Redis (change from 6379)
  - "3001:3000"  # App (change from 3000)
```

#### Need to reset everything (Docker)

```bash
# Remove all containers and volumes (⚠️ deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d

# Re-seed database
npm run seed -- --scale=small
```

#### CORS errors

```typescript
// src/main.ts - Already configured, but check:
app.enableCors({
  origin: '*', // Change in production
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

### Frontend Issues

#### Frontend won't start

```bash
# Check for port conflicts
lsof -i:5173

# Clear cache
rm -rf node_modules .vite
npm install
npm run dev
```

#### API connection errors

```bash
# Check backend is running
curl http://localhost:3000/api/v1/health

# Check CORS settings
# Check browser console for errors
```

#### Build errors

```bash
# Clear and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### Common Issues

#### "Cannot find module" errors

```bash
# Reinstall dependencies
npm install
cd frontend && npm install
```

#### "Port already in use"

```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

#### "Database relation does not exist"

```bash
# Enable synchronize or run migrations
# Check src/config/database.config.ts
synchronize: true  # For development only

# Or run migrations
npm run typeorm:migration:run
```

---

## Best Practices

### Backend

1. **Always use DTOs** for request/response validation
2. **Use guards** for authentication and authorization
3. **Handle errors** properly with try-catch
4. **Use transactions** for multiple database operations
5. **Add logging** for debugging
6. **Write tests** for critical functionality

### Frontend

1. **Handle loading states** in all async operations
2. **Show error messages** to users
3. **Validate forms** before submission
4. **Use TypeScript** for type safety
5. **Optimize re-renders** with proper dependencies
6. **Handle edge cases** (empty data, errors, etc.)

### Database

1. **Use indexes** on frequently queried columns
2. **Avoid N+1 queries** - use relations properly
3. **Use transactions** for data integrity
4. **Backup regularly** in production
5. **Monitor query performance**

---

## Quick Command Reference

### Backend
```bash
./scripts/backend-control.sh start      # Start
./scripts/backend-control.sh stop       # Stop
./scripts/backend-control.sh restart    # Restart
./scripts/backend-control.sh status     # Check status
./scripts/backend-control.sh logs      # View logs
npm run start:dev                       # Development mode
npm run build                           # Build for production
npm run seed -- --scale=small           # Seed database
npm run list-users                      # List all user credentials
```

### Frontend
```bash
./scripts/frontend-control.sh stop      # Stop
./scripts/frontend-control.sh status    # Check status
cd frontend
npm run dev                             # Development server
npm run build                           # Production build
npm run preview                         # Preview production build
```

### Database
```bash
docker-compose ps                       # Check status
docker-compose logs -f postgres         # View logs
docker-compose exec postgres psql -U postgres -d reporting_engine  # Connect
docker-compose up -d postgres redis     # Start
docker-compose stop postgres redis       # Stop
```

### All Services
```bash
# Start everything
docker-compose up -d postgres redis && \
./scripts/backend-control.sh start && \
cd frontend && npm run dev

# Stop everything
./scripts/backend-control.sh stop && \
docker-compose stop postgres redis && \
pkill -f "vite"
```

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
