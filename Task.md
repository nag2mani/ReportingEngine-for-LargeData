# Reporting Engine For Large Data

---

## Overview

These tasks introduce you to system design and full-stack engineering for high-scale financial reporting. The goal is to demonstrate clean architecture, modular code, and sound trade-offs — not to build a production system end-to-end. Be ready to explain your design decisions, show a live demo, and place all code in GitHub repositories.

---

## General Guidelines

* Write **clean, modular, well-documented** code. Follow best practices in structure and naming.
* Keep your solution readable and maintainable; split responsibilities into small components/services.
* Prepare a **live demo** (IDE + running services) — we may ask about it in the next round.
* **All code must be pushed to GitHub**. You may use separate repositories for different tasks.
* Each repo must contain a clear `README.md` with:

  * Setup and run instructions
  * Design decisions and architecture diagram (or plain text explanation)
  * Assumptions, limitations, and known production challenges
  * List of APIs and how to test them (Postman collection recommended)
* You are allowed to use GenAI tools and public references. For transparency, include:

  * Links to any websites or GitHub repos you consulted.
  * Exported chat logs for any LLMs used (for example ChatGPT full chat link).
  * Commits from tools like Cursor with prompts in commit descriptions, or screenshots of external discussions/sources.
* **Optional tasks** may be unimplemented but must include a clear plan and approach showing how they would be integrated later.
* **Hard deadline:** Any commits after **10:30 AM on 28th November (local)** will disqualify the submission.

---

## Deliverables (for each task)

1. GitHub repository with code.
2. `README.md` (see required contents above).
3. Postman collection or API documentation.
4. Dockerfile and instructions for containerization; K8s manifests or a deployment strategy.
5. A short demo script / runbook to reproduce the demo locally.
6. A short report (1–2 pages) describing trade-offs, scalability strategy, and what you would change for production.

---

# Task 1 — Reporting Engine for Large Data

**Goal:** Build a backend reporting engine that can produce multi-level financial reports over large datasets (millions of rows) while remaining maintainable and scalable.

### Provided schema (conceptual)

You should design and populate a database containing at least these logical tables:

* **Students** — student_id, name, school_id, class, contact info, metadata (other fields you deem necessary)
* **FeeBills** — bill_id, student_id, due_date, total_amount, bill_status, line_items (or normalized table), created_at
* **Transactions** — transaction_id, bill_id (nullable), student_id, amount, method, status, provider_reference, created_at, updated_at
* **TransactionStatus** — audit/status history for transactions (timestamp, status, reason, metadata)

> You don’t need to implement every possible field — include enough fields to demonstrate joins, filters, and querying challenges.

### Reporting requirements (three levels)

1. **Summary (Admin Dashboard)**

   * Total fees to be collected (by time range, by school, by class)
   * Total collected so far
   * Outstanding / pending amounts
   * Filters: date range, school, class, student, payment method
   * Support time-series views (daily / weekly / monthly aggregation)

2. **Detailed (Operational)**

   * List of recent transactions with searchable columns
   * Drill-down from a summary metric to underlying bills/transactions
   * Pagination and server-side filtering for large result sets

3. **Developer/Monitoring (Optional)**

   * View of failed transactions with debug metadata
   * Ability to filter by provider, error codes, time windows
   * Alerts (email/SMS) strategy for repeated failures

### Scalability & system design expectations

* Design for **millions of rows** and **thousands of concurrent queries**.
* Plan for irregular data influx (batch imports, near-real-time streaming).
* Discuss indexing, partitioning, materialized views, caching layers (Redis/Elasticache), and OLAP vs OLTP choices.
* If using multiple databases (e.g., relational + columnar/analytical store), explain the sync/ETL strategy (Kafka, CDC, batch ETL jobs).
* Explain how you would shard/partition data (by school, by date) and why.

### Authorization & Security

* Create an authorization model supporting role-based access and **field-level** permissions.

  * Roles might include: Admin, School Accountant, Auditor, Developer, ReadOnlyAnalyst.
  * Explain what fields/actions are restricted for each role.
* Explain authentication approach (JWT, OAuth, or session-based) and secrets management.

### Tech & Implementation requirements

* Preferred backend: **NestJS (TypeScript)** or **Spring (Java)**, but other frameworks are acceptable.
* Provide a **Postman collection** covering all APIs and common use-cases.
* Containerize the solution (Docker) and include K8s deployment manifests or Helm chart skeleton.
* Populate the database with realistic **dummy data** — assume ~1000 schools and generate students, bills and transactions at an appropriate scale for demonstration (guesstimates are fine).

### Deployment & Production suggestions

* Suggest AWS services for production (examples):

  * Compute: EKS / ECS / EC2 AutoScaling
  * Databases: RDS (Postgres) for OLTP, Redshift / Athena / Snowflake for analytics
  * Streaming / ETL: MSK (Kafka), Kinesis, or managed CDC solutions
  * Caching: Elasticache (Redis)
  * Observability: CloudWatch + Prometheus + Grafana, X-Ray
  * Alerting: SNS + SES for notifications
* Describe deployment strategy, CI/CD, and secrets/configuration management (e.g., AWS Secrets Manager, SSM Parameter Store).

---

# Task 2 — Payments Analysis Dashboard (Frontend)

**Goal:** Build a clean, modern frontend to visualize and interact with the reporting engine created in Task 1.

### Required components

* **Login Page** (signup optional — create users in DB for demo)
* **Dashboard** with key metrics (totals, charts, filters).
* **Recent Transactions Table** with pagination; show only fields permitted by the logged-in user’s role/permissions.

### Optional enhancements (recommended if time permits)

* Sorting and filtering on table columns (server-side)
* Transaction detail page/modal on row click
* Developer portal to inspect failed transactions with debug info

### UI/Tech guidance

* Preferred stack: **TypeScript + React** (or Vue/Angular) and **Tailwind CSS** for styling.
* Keep the UI modern, accessible, and mobile-responsive.
* Organize the frontend code for maintainability (components, services, hooks/store).
* Add unit tests / integration tests where feasible.

---

## Evaluation Criteria

* **Correctness & completeness** — Meets core requirements and provides the deliverables requested.
* **Design quality** — Clear architecture, reasoning about scalability and trade-offs.
* **Code quality** — Readability, modularity, tests, and documentation.
* **Usability** — Clean UI and straightforward demo experience.
* **Transparency** — Proper attribution of references and LLM/tool assistance.

---

## Quick Submission Checklist

* [ ] GitHub repo(s) with code
* [ ] `README.md` with setup, architecture, and assumptions
* [ ] Postman collection or API docs
* [ ] Dockerfile + K8s manifests (or deployment plan)
* [ ] Dummy dataset generation script + sample data
* [ ] Short report on production challenges and mitigation steps
* [ ] Links / exported LLM chats / references used
* [ ] Demo runbook

---
