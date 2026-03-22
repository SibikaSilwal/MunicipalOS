# Municipal OS — Tech Stack

## Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + TypeScript | Citizen portal, Officer dashboard, Admin panel |
| Backend | .NET Web API (Minimal API), C# | REST API, business logic, workflow engine |
| Database | PostgreSQL | Relational data store for all entities |
| Message Queue | RabbitMQ | Event bus for async processing (audit logs, notifications) |
| Object Storage | MinIO | S3-compatible file storage for uploaded documents |
| Authentication | JWT + RBAC | Stateless auth with role claims embedded in token |
| PDF Generation | QuestPDF | .NET library for generating certificate PDFs |
| Validation | FluentValidation | Request validation in the API layer |
| ORM | Entity Framework Core + Npgsql | Database access and migrations |
| Containerization | Docker Compose | Local development and deployment orchestration |

---

## Why This Stack

### React + TypeScript (Frontend)

React is the most widely adopted frontend framework with a mature ecosystem. TypeScript adds compile-time safety, which is important for a system handling government workflows where data integrity matters.

### .NET Minimal API (Backend)

.NET provides enterprise-grade performance and a robust ecosystem for building APIs. Minimal API reduces boilerplate while retaining full access to middleware, DI, and EF Core. This signals architecture maturity compared to typical local vendor stacks.

### PostgreSQL (Database)

Open-source, production-proven relational database. Supports JSONB for flexible audit metadata alongside strict relational schemas for core entities. Strong choice for government systems where data consistency is non-negotiable.

### RabbitMQ (Message Queue)

Enables event-driven architecture without the complexity of Kafka. Handles the publish/subscribe pattern for audit log insertion, notification dispatch, and workflow history tracking. Demonstrates real production architecture experience.

### MinIO (Object Storage)

S3-compatible object storage that runs locally. Separates file storage from relational data — a pattern expected in government systems. Trivially replaceable with AWS S3 or Azure Blob in production.

### QuestPDF (PDF Generation)

.NET-native PDF library with a fluent API for building document templates. Used to auto-generate official certificates (residency, permits) upon application approval.

---

## Project Structure

```
municipal-os/
├── frontend/                    # React + TypeScript app
├── backend/
│   ├── MunicipalOS.Api/         # API layer (controllers, middleware, DI)
│   ├── MunicipalOS.Domain/      # Domain models, interfaces, business logic
│   └── MunicipalOS.Infrastructure/  # EF Core, RabbitMQ, MinIO, PDF implementations
├── docker-compose.yml           # Full stack orchestration
└── docs/                        # Documentation files
```

### Backend Module Layout

```
backend/src/
├── Auth/              # JWT authentication, registration, login
├── Applications/      # Application submission, status management
├── Workflow/          # Workflow engine, step advancement, routing
├── Documents/         # File upload/download, MinIO integration
├── Notifications/     # Notification dispatch (email stub)
└── Audit/             # Audit log consumer, event recording
```

---

## Deployment Stack

All services run via Docker Compose:

| Service | Container |
|---------|-----------|
| Frontend | React app (nginx) |
| Backend | .NET API |
| Database | PostgreSQL |
| Queue | RabbitMQ |
| Storage | MinIO |

```bash
docker-compose up    # Runs entire municipality stack locally
```

Production targets: AWS EC2 or Azure App Service.
