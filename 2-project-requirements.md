# Municipal OS — Project Requirements

## Functional Requirements

### Citizen Portal

| Requirement | Details |
|-------------|---------|
| Registration & Login | Citizens register with email/password; JWT-based authentication |
| Dashboard | View all submitted applications with current statuses; buttons to apply for a new service or view history |
| Apply for Service | Multi-step form: select service type → upload required documents → submit application |
| Track Status | Timeline UI showing each workflow stage (Submitted → Ward Review → Municipal Review → Approved) with a visual progress bar |
| Download Certificate | After approval, download auto-generated PDF certificate |

### Officer Dashboard

| Requirement | Details |
|-------------|---------|
| Pending Queue | Sortable table showing Application ID, Citizen Name, Service Type, and Submission Date for all applications assigned to the officer's role |
| Application Review | View full application details including uploaded documents |
| Actions | Approve, Reject, or Request Additional Documents — each with a comment/note textarea |
| Workflow Viewer | Display previous steps (completed), current step (active), and next step (upcoming) for each application |

### Admin Panel

| Requirement | Details |
|-------------|---------|
| Service Type Management | Create and edit service types (e.g., Residency Certificate, Building Permit) with name, description, and list of required documents |
| Workflow Definition | Define multi-step approval workflows per service type by selecting role order (e.g., WardOfficer → MunicipalOfficer) — no code changes required |
| Officer Assignment | Assign officer roles to users |
| PDF Template Management | Upload and manage certificate PDF templates |
| Audit Log Viewer | View immutable audit timeline of all system actions |

### System-Level Features

| Feature | Details |
|---------|---------|
| Audit Logging | Every action (submit, approve, reject, upload) is recorded with: who, what, when, and source IP. Entries are immutable. Inserted via RabbitMQ consumer for decoupled processing |
| PDF Generation | Automatically produce official certificate PDFs upon application approval using QuestPDF templates. Includes citizen name, municipality, approval date, and officer signature placeholder |
| Workflow Engine | Configurable multi-step routing. Admin defines step order and required role per step. Engine handles `advanceStep()`, `assignNextOfficer()`, and `evaluateCompletion()` logic |
| Event-Driven Architecture | Key actions publish events to RabbitMQ (ApplicationSubmitted, ApplicationApproved, ApplicationRejected, DocumentUploaded). Consumers handle audit logging, notifications, and workflow history |
| Document Storage | Files stored in MinIO (S3-compatible object storage); metadata stored in PostgreSQL. Separation follows government data architecture best practices |
| Role-Based Access Control | Four roles with hierarchical permissions: Citizen, WardOfficer, MunicipalOfficer, Admin. Role embedded in JWT payload |

---

## Non-Functional Requirements

| Requirement | Details |
|-------------|---------|
| Local Development | Entire stack runs locally via `docker-compose up` (frontend, backend, postgres, rabbitmq, minio) |
| Deployment Targets | Deployable to AWS EC2 or Azure App Service |
| Architecture Style | Modular monolith with event-driven boundaries — service boundaries (Auth, Workflow, Documents, Notifications) are logically separated and can be split into independent microservices later |
| Data Integrity | PostgreSQL for relational data with foreign key constraints; JSONB for flexible audit metadata |
| Security | Password hashing, JWT authentication, role-based endpoint authorization |

---

## User Roles Summary

| Role | Access Scope |
|------|-------------|
| **Citizen** | Own applications, own documents, own notifications, public service type listing |
| **WardOfficer** | Applications at their workflow step, approve/reject/forward actions |
| **MunicipalOfficer** | Applications at their workflow step, final approval authority |
| **Admin** | Full system configuration: service types, workflows, officer roles, audit logs, PDF templates |
