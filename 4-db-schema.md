# Municipal OS — Database Schema

All primary keys are UUIDs. Timestamps use `TIMESTAMP WITH TIME ZONE`. Foreign keys are marked with (FK).

---

## Tables

### `roles`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | TEXT | NOT NULL, UNIQUE |

**Seed data:** Citizen, WardOfficer, MunicipalOfficer, Admin

---

### `municipalities`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | TEXT | NOT NULL |

---

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| email | TEXT | NOT NULL, UNIQUE |
| password_hash | TEXT | NOT NULL |
| full_name | TEXT | NOT NULL |
| role_id | UUID | FK → roles.id |
| municipality_id | UUID | FK → municipalities.id |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

---

### `service_types`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| description | TEXT | |
| municipality_id | UUID | FK → municipalities.id |

---

### `required_documents`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| service_type_id | UUID | FK → service_types.id |
| name | TEXT | NOT NULL |
| required | BOOLEAN | NOT NULL, DEFAULT TRUE |

---

### `workflow_definitions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| service_type_id | UUID | FK → service_types.id, UNIQUE |

---

### `workflow_steps`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workflow_definition_id | UUID | FK → workflow_definitions.id |
| step_order | INT | NOT NULL |
| role_required | TEXT | NOT NULL |

**Example rows:**

| step_order | role_required |
|------------|---------------|
| 1 | WardOfficer |
| 2 | MunicipalOfficer |

---

### `applications`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| citizen_id | UUID | FK → users.id |
| service_type_id | UUID | FK → service_types.id |
| status | TEXT | NOT NULL (Submitted, UnderReview, Approved, Rejected, DocumentsRequested) |
| current_step | INT | NOT NULL, DEFAULT 1 |
| submitted_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

---

### `application_documents`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| application_id | UUID | FK → applications.id |
| document_name | TEXT | NOT NULL |
| file_path | TEXT | NOT NULL (MinIO object key) |
| uploaded_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

---

### `application_status_history`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| application_id | UUID | FK → applications.id |
| status | TEXT | NOT NULL |
| changed_by | UUID | FK → users.id |
| changed_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| comment | TEXT | |

---

### `audit_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| event_type | TEXT | NOT NULL (e.g., ApplicationSubmitted, OfficerApproved) |
| user_id | UUID | FK → users.id |
| application_id | UUID | FK → applications.id, NULLABLE |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| metadata | JSONB | Additional context (IP address, old/new values, etc.) |

---

### `notifications`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| message | TEXT | NOT NULL |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE |
| sent_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

---

## Entity Relationships

```
roles ──────────────< users >──────────────── municipalities
                        │
                        │ (citizen_id)
                        ▼
service_types ────< applications >───< application_documents
      │                 │
      │                 ├───< application_status_history
      │                 │
      │                 └───< audit_logs
      │
      ├───< required_documents
      │
      └─── workflow_definitions ───< workflow_steps

users ───< notifications
```

**Key relationships:**

- A **user** belongs to one **role** and one **municipality**
- A **service_type** belongs to a **municipality** and has many **required_documents**
- Each **service_type** has one **workflow_definition**, which has many ordered **workflow_steps**
- An **application** is created by a citizen (user), references a service_type, and has many **application_documents** and **status_history** entries
- **audit_logs** reference the acting user and optionally an application; metadata is stored as flexible JSONB
- **notifications** belong to a user and track read/unread state
