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
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Initial Setup

```bash
# 1. Clone and navigate to project
cd ReportingEngine-for-LargeData

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

---

## Running & Stopping Services

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

---

## Adding More Data

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
npm run typeorm:migration:run

# Revert last migration
npm run typeorm:migration:revert
```

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

### Testing APIs

#### Using curl

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"password123"}'

# Get summary (replace TOKEN)
curl http://localhost:3000/api/v1/reports/summary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create payment
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": "UUID",
    "student_id": "UUID",
    "amount_paid": 10000,
    "method": "upi"
  }'
```

#### Using Postman

1. Import `postman_collection.json`
2. Run "Authentication → Login" to get token
3. Token is automatically saved to collection variable
4. Test other endpoints

### API Response Format

```typescript
// Success response
{
  "data": { ... },
  "message": "Success" // optional
}

// Error response
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}

// Paginated response
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

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

## Troubleshooting

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

## Project Structure Reference

```
reporting-engine/
├── src/                          # Backend source
│   ├── entities/                # Database entities
│   ├── modules/                 # Feature modules
│   │   ├── auth/
│   │   ├── students/
│   │   ├── fees/
│   │   ├── payments/
│   │   └── reports/
│   ├── common/                  # Shared code
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── decorators/
│   └── config/                  # Configuration
├── frontend/                     # Frontend source
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── context/             # React context
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
├── scripts/                      # Utility scripts
│   ├── seed.ts                  # Database seeding
│   └── backend-control.sh       # Backend control
├── k8s/                          # Kubernetes manifests
├── docker-compose.yml            # Docker services
└── README.md                     # Main documentation
```

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TypeORM Documentation](https://typeorm.io/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Quick Command Reference

```bash
# Backend
./scripts/backend-control.sh start|stop|restart|status|logs
npm run start:dev              # Development mode
npm run build                  # Build for production
npm run seed -- --scale=small  # Seed database

# Frontend
cd frontend
npm run dev                    # Development server
npm run build                  # Production build
npm run preview                # Preview production build

# Database
docker-compose up -d postgres redis    # Start
docker-compose stop postgres redis     # Stop
docker-compose logs -f postgres        # View logs

# All Services
docker-compose up -d postgres redis && \
./scripts/backend-control.sh start && \
cd frontend && npm run dev
```

---

**Last Updated**: 2025-11-27

For more details, see:
- [README.md](README.md) - Main documentation
- [BACKEND_CONTROL.md](BACKEND_CONTROL.md) - Backend control guide
- [frontend/README.md](frontend/README.md) - Frontend documentation
