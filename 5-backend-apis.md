# Municipal OS — Backend API Reference

All endpoints are prefixed with `/api`. Authentication is via JWT Bearer token unless marked as Public.

---

## Auth Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register a new citizen account | Public |
| POST | `/auth/login` | Authenticate and receive JWT | Public |
| GET | `/auth/me` | Get current user profile from token | Any role |

**POST `/auth/register`**

Request:
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "municipalityId": "uuid"
}
```

Response: `201 Created` with user object and JWT token.

**POST `/auth/login`**

Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response: `200 OK` with JWT token. Token payload contains `userId`, `role`, `municipalityId`.

**GET `/auth/me`**

Response: `200 OK` with current user profile (id, email, fullName, role, municipality).

---

## Users Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/{id}` | Get user by ID | Admin |
| PATCH | `/users/{id}` | Update user profile | Self or Admin |

---

## Municipalities Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/municipalities` | List all municipalities | Public |

---

## Service Types Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/service-types` | List available service types (filtered by municipality) | Any role |
| POST | `/service-types` | Create a new service type with required documents | Admin |
| PATCH | `/service-types/{id}` | Update service type details | Admin |

**POST `/service-types`**

Request:
```json
{
  "name": "Residency Certificate",
  "description": "Official proof of residence",
  "municipalityId": "uuid",
  "requiredDocuments": [
    { "name": "Citizenship Certificate", "required": true },
    { "name": "Photo", "required": true },
    { "name": "Supporting Letter", "required": false }
  ]
}
```

---

## Applications Module

### Citizen Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/applications` | Submit a new application | Citizen |
| GET | `/applications/my` | List current citizen's applications | Citizen |
| GET | `/applications/{id}` | Get application details with status history | Citizen (own) / Officer / Admin |

**POST `/applications`**

Request:
```json
{
  "serviceTypeId": "uuid"
}
```

Response: `201 Created` with application ID. Status is set to `Submitted`, current_step to `1`.

### Officer Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/applications/pending` | List applications pending at officer's workflow step | WardOfficer / MunicipalOfficer |
| POST | `/applications/{id}/approve` | Approve application and advance workflow | WardOfficer / MunicipalOfficer |
| POST | `/applications/{id}/reject` | Reject application with reason | WardOfficer / MunicipalOfficer |
| POST | `/applications/{id}/request-documents` | Request additional documents from citizen | WardOfficer / MunicipalOfficer |

**POST `/applications/{id}/approve`**

Request:
```json
{
  "comment": "Documents verified, approved."
}
```

Side effects: Inserts status_history record, publishes `ApplicationApproved` event to RabbitMQ, calls workflow engine `advanceStep()`.

**POST `/applications/{id}/reject`**

Request:
```json
{
  "comment": "Incomplete citizenship certificate."
}
```

**POST `/applications/{id}/request-documents`**

Request:
```json
{
  "comment": "Please upload a clear photo of your citizenship certificate."
}
```

---

## Documents Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/documents/upload` | Upload a document for an application | Citizen |
| GET | `/documents/{id}` | Download/retrieve a document | Citizen (own) / Officer / Admin |

**POST `/documents/upload`**

Request: `multipart/form-data` with fields `applicationId`, `documentName`, and `file`.

Response: `201 Created` with document metadata. File is stored in MinIO; metadata in PostgreSQL.

---

## Workflow Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/workflows` | Create a workflow definition for a service type | Admin |
| GET | `/workflows/{serviceTypeId}` | Get workflow steps for a service type | Admin / Officer |

**POST `/workflows`**

Request:
```json
{
  "serviceTypeId": "uuid",
  "steps": [
    { "stepOrder": 1, "roleRequired": "WardOfficer" },
    { "stepOrder": 2, "roleRequired": "MunicipalOfficer" }
  ]
}
```

### Internal Workflow Engine (not exposed as API)

| Method | Description |
|--------|-------------|
| `advanceStep(applicationId)` | Move application to next workflow step and assign to appropriate role |
| `assignNextOfficer(applicationId)` | Determine which officer role handles the next step |
| `evaluateCompletion(applicationId)` | Check if all workflow steps are complete; if so, mark as Approved |

---

## Certificate Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/applications/{id}/certificate` | Download auto-generated PDF certificate | Citizen (own) / Admin |

Response: `200 OK` with `application/pdf` content type. Generated via QuestPDF with citizen name, municipality, approval date, and officer signature placeholder.

Only available for applications with status `Approved`.

---

## Notifications Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications` | List notifications for current user | Any role |

Notification triggers (created automatically via RabbitMQ consumers):

| Event | Notification Message |
|-------|---------------------|
| Application submitted | "Your application has been submitted successfully." |
| Application approved | "Your application has been approved." |
| Application rejected | "Your application has been rejected." |
| Documents requested | "Additional documents have been requested for your application." |

---

## Admin Module

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/workflows` | Create/update workflow definitions | Admin |
| POST | `/admin/pdf-template` | Upload a PDF certificate template | Admin |
| GET | `/admin/audit-logs` | Query audit log entries with filters | Admin |

**GET `/admin/audit-logs`**

Query params: `userId`, `applicationId`, `eventType`, `from`, `to` (date range).

Response: Paginated list of audit log entries with metadata.
