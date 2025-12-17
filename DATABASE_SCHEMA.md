# Database Schema

This document describes the complete database schema for the Reporting Engine application.

## Core Tables

### `schools`

Multi-tenant organization table. Each school is a separate tenant.

- `id` (uuid, PK) - Primary key
- `name` (varchar) - School name
- `timezone` (varchar) - Timezone for the school (e.g., 'Asia/Kolkata')
- `region` (varchar) - Geographic region
- `created_at` (timestamptz) - Creation timestamp

**Relationships:**
- One-to-many with `students`
- One-to-many with `fee_bills`
- One-to-many with `payments`
- One-to-many with `users`

### `students`

Student information table. Scoped by `school_id` for multi-tenant isolation.

- `id` (uuid, PK) - Primary key
- `school_id` (uuid, FK) - Foreign key to `schools.id`
- `student_number` (varchar, unique per school) - Unique identifier within school
- `first_name` (varchar) - Student's first name
- `last_name` (varchar) - Student's last name
- `class` (varchar) - Class/grade (e.g., '10', '11', '12')
- `section` (varchar) - Section (e.g., 'A', 'B', 'C')
- `admission_date` (date) - Date of admission
- `email` (varchar) - Student email (may be masked based on permissions)
- `phone` (varchar) - Student phone (may be masked based on permissions)
- `is_active` (boolean) - Whether student is currently active
- `meta` (jsonb) - Additional metadata (e.g., parent_name, address)

**Indexes:**
- `(school_id, student_number)` - Composite index for fast lookups
- `(school_id, class)` - Composite index for class-based queries

**Relationships:**
- Many-to-one with `schools`
- One-to-many with `fee_bills`
- One-to-many with `payments`

### `fee_bills`

Fee bill records for students. Tracks amount due, due dates, and payment status.

- `id` (uuid, PK) - Primary key
- `school_id` (uuid, FK) - Foreign key to `schools.id`
- `student_id` (uuid, FK) - Foreign key to `students.id`
- `amount_due` (numeric(12,2)) - Total amount due
- `due_date` (date) - Payment due date
- `period` (varchar) - Billing period (e.g., '2025-01', '2025-02')
- `status` (enum) - Bill status: `due`, `partial`, `paid`, `overdue`
- `meta` (jsonb) - Additional metadata (e.g., breakdown: tuition, transport, library, sports)

**Indexes:**
- `(school_id, due_date)` - Composite index for date-based queries
- `(student_id)` - Index for student-specific queries
- `(status)` - Index for status filtering

**Relationships:**
- Many-to-one with `schools`
- Many-to-one with `students`
- One-to-many with `payments`

### `payments`

Payment transactions. Can be linked to fee bills or standalone.

- `id` (uuid, PK) - Primary key
- `fee_bill_id` (uuid, FK, nullable) - Foreign key to `fee_bills.id` (null for standalone payments)
- `school_id` (uuid, FK) - Foreign key to `schools.id`
- `student_id` (uuid, FK) - Foreign key to `students.id`
- `amount_paid` (numeric(12,2)) - Amount paid
- `method` (enum) - Payment method: `cash`, `card`, `upi`, `netbanking`, `cheque`, `wallet`
- `payment_provider` (varchar, nullable) - Payment gateway provider (e.g., 'Razorpay', 'Stripe')
- `provider_txn_id` (varchar, unique, nullable) - Transaction ID from payment provider
- `status` (enum) - Payment status: `initiated`, `success`, `failed`, `reversed`
- `initiated_at` (timestamptz) - When payment was initiated
- `completed_at` (timestamptz, nullable) - When payment was completed
- `metadata` (jsonb) - Additional metadata (e.g., gateway_response, fees)

**Indexes:**
- `(school_id, completed_at)` - Composite index for time-based queries
- `(provider_txn_id)` - Unique index for provider transaction lookups
- `(fee_bill_id)` - Index for fee bill-related queries
- `(status)` - Index for status filtering

**Relationships:**
- Many-to-one with `schools`
- Many-to-one with `students`
- Many-to-one with `fee_bills` (optional)
- One-to-many with `transaction_status`

### `transaction_status`

Payment status history. Tracks status changes over time for audit purposes.

- `id` (uuid, PK) - Primary key
- `payment_id` (uuid, FK) - Foreign key to `payments.id`
- `status` (varchar) - Status at this point in time
- `changed_at` (timestamptz) - When status changed
- `notes` (text, nullable) - Additional notes about the status change

**Relationships:**
- Many-to-one with `payments`

## Authorization Tables

### `users`

User accounts for authentication and authorization.

- `id` (uuid, PK) - Primary key
- `email` (varchar, unique) - User email (used for login)
- `hashed_password` (varchar) - Bcrypt hashed password
- `name` (varchar) - User's display name
- `school_id` (uuid, FK, nullable) - Foreign key to `schools.id` (null for platform admins)
- `role_id` (uuid, FK) - Foreign key to `roles.id`
- `is_active` (boolean) - Whether user account is active
- `created_at` (timestamptz) - Account creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- `(email)` - Unique index for login lookups
- `(school_id)` - Index for school-based queries

**Relationships:**
- Many-to-one with `schools` (optional)
- Many-to-one with `roles`
- One-to-many with `audit_logs`

### `roles`

Role definitions for RBAC (Role-Based Access Control).

- `id` (uuid, PK) - Primary key
- `name` (varchar, unique) - Role name (e.g., 'platform_admin', 'school_admin', 'accountant')
- `description` (text) - Role description

**Default Roles:**
- `platform_admin` - Full access to all schools and resources
- `school_admin` - Full access within their school
- `accountant` - Financial access (fee bills, payments, reports)
- `teacher` - Read-only access to students and reports
- `readonly` - Read-only access to all resources

**Relationships:**
- One-to-many with `users`
- One-to-many with `permissions`
- One-to-many with `field_permissions`

### `permissions`

Action-level permissions. Defines what actions a role can perform on resources.

- `id` (uuid, PK) - Primary key
- `role_id` (uuid, FK) - Foreign key to `roles.id`
- `resource` (enum) - Resource type: `students`, `fee_bills`, `payments`, `reports`, `schools`, `users`
- `action` (enum) - Action type: `read`, `create`, `update`, `delete`

**Example:**
- Role: `accountant`, Resource: `payments`, Action: `read` → Accountant can read payments
- Role: `accountant`, Resource: `payments`, Action: `create` → Accountant can create payments

**Relationships:**
- Many-to-one with `roles`

### `field_permissions`

Field-level permissions. Restricts access to specific fields within resources.

- `id` (uuid, PK) - Primary key
- `role_id` (uuid, FK) - Foreign key to `roles.id`
- `resource` (enum) - Resource type (same as `permissions.resource`)
- `field_name` (varchar) - Name of the field to restrict
- `allowed_actions` (jsonb array) - Array of allowed actions for this field (empty array = no access)

**Example:**
- Role: `accountant`, Resource: `students`, Field: `email`, Allowed Actions: `[]` → Accountant cannot see student email
- Role: `accountant`, Resource: `students`, Field: `phone`, Allowed Actions: `[]` → Accountant cannot see student phone

**Relationships:**
- Many-to-one with `roles`

### `audit_logs`

Audit trail for all data changes. Tracks who did what and when.

- `id` (uuid, PK) - Primary key
- `user_id` (uuid, FK) - Foreign key to `users.id`
- `resource` (varchar) - Resource type that was modified
- `resource_id` (uuid) - ID of the resource that was modified
- `action` (varchar) - Action performed (e.g., 'create', 'update', 'delete')
- `changes` (jsonb) - JSON object containing before/after values
- `ip_address` (varchar, nullable) - IP address of the user
- `user_agent` (text, nullable) - User agent string
- `created_at` (timestamptz) - When the action occurred

**Relationships:**
- Many-to-one with `users`

## Entity Relationship Diagram

```
┌─────────────┐
│   schools   │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  students   │ │  fee_bills  │ │  payments   │ │    users    │
└──────┬───────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │                │                │              │
       │                │                │              │
       │                └────────┬───────┘              │
       │                         │                      │
       │                         ▼                      │
       │                ┌──────────────────┐           │
       │                │transaction_status│           │
       │                └──────────────────┘           │
       │                                                │
       │                                                ▼
       │                                        ┌─────────────┐
       │                                        │    roles    │
       │                                        └──────┬──────┘
       │                                               │
       │                                               ├──────────────┬──────────────┐
       │                                               │              │              │
       │                                               ▼              ▼              ▼
       │                                        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
       │                                        │permissions  │ │field_perms  │ │audit_logs   │
       │                                        └─────────────┘ └─────────────┘ └─────────────┘
       │
       └────────────────────────────────────────────────────────────────────────────────────┘
```

## Indexing Strategy

### Composite Indexes

Composite indexes are used for common query patterns:

1. **`(school_id, student_number)`** on `students`
   - Used for: Finding a specific student within a school
   - Query pattern: `WHERE school_id = ? AND student_number = ?`

2. **`(school_id, class)`** on `students`
   - Used for: Finding all students in a class within a school
   - Query pattern: `WHERE school_id = ? AND class = ?`

3. **`(school_id, due_date)`** on `fee_bills`
   - Used for: Finding bills due in a date range for a school
   - Query pattern: `WHERE school_id = ? AND due_date BETWEEN ? AND ?`

4. **`(school_id, completed_at)`** on `payments`
   - Used for: Finding payments in a time range for a school
   - Query pattern: `WHERE school_id = ? AND completed_at BETWEEN ? AND ?`

### Single Column Indexes

1. **`(student_id)`** on `fee_bills` - Fast student bill lookups
2. **`(fee_bill_id)`** on `payments` - Fast bill payment lookups
3. **`(status)`** on `fee_bills` and `payments` - Status filtering
4. **`(provider_txn_id)`** on `payments` - Unique index for payment gateway lookups
5. **`(email)`** on `users` - Unique index for login lookups

## Data Types

- **UUID**: Used for all primary keys and foreign keys for better distribution and security
- **VARCHAR**: Variable-length strings for names, emails, etc.
- **NUMERIC(12,2)**: Fixed-precision decimal for monetary amounts (supports up to 9,999,999,999.99)
- **JSONB**: PostgreSQL's binary JSON format for flexible metadata storage
- **ENUM**: Used for status fields and resource/action types
- **TIMESTAMPTZ**: Timezone-aware timestamps for all date/time fields
- **BOOLEAN**: Simple true/false flags

## Multi-Tenancy

The database uses **row-level multi-tenancy** where:

- All tenant-scoped tables include a `school_id` column
- Queries are automatically filtered by `school_id` based on the user's context
- Platform admins (with `school_id = NULL`) can access all schools
- School-scoped users can only access data for their school

This approach provides:
- **Data Isolation**: Complete separation between tenants
- **Scalability**: Can scale horizontally by partitioning on `school_id`
- **Security**: Prevents cross-tenant data access at the database level

## Future Enhancements

1. **Table Partitioning**: Partition large tables (`payments`, `fee_bills`) by `school_id` or date ranges
2. **Read Replicas**: Use read replicas for reporting queries to reduce load on primary database
3. **Materialized Views**: Pre-aggregated views for common dashboard queries
4. **Archival Strategy**: Move old data to archive tables to keep active tables lean
