-- ============================================================
-- 001_InitialCreate.sql
-- Creates all tables for MunicipalOS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- roles
CREATE TABLE roles (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

INSERT INTO roles (id, name) VALUES
    ('a1b2c3d4-0001-0000-0000-000000000001', 'Citizen'),
    ('a1b2c3d4-0002-0000-0000-000000000002', 'WardOfficer'),
    ('a1b2c3d4-0003-0000-0000-000000000003', 'MunicipalOfficer'),
    ('a1b2c3d4-0004-0000-0000-000000000004', 'Admin');

-- municipalities
CREATE TABLE municipalities (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL
);

-- users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    role_id         UUID NOT NULL REFERENCES roles(id),
    municipality_id UUID NOT NULL REFERENCES municipalities(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_users_email ON users (email);

-- service_types
CREATE TABLE service_types (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT,
    municipality_id UUID NOT NULL REFERENCES municipalities(id)
);

-- required_documents
CREATE TABLE required_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    name            TEXT NOT NULL,
    required        BOOLEAN NOT NULL DEFAULT TRUE
);

-- workflow_definitions (one per service_type)
CREATE TABLE workflow_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type_id UUID NOT NULL UNIQUE REFERENCES service_types(id)
);

-- workflow_steps
CREATE TABLE workflow_steps (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
    step_order             INT  NOT NULL,
    role_required          TEXT NOT NULL
);

-- applications
CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id      UUID NOT NULL REFERENCES users(id),
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    status          TEXT NOT NULL DEFAULT 'Submitted',
    current_step    INT  NOT NULL DEFAULT 1,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_applications_citizen_id ON applications (citizen_id);
CREATE INDEX ix_applications_status ON applications (status);

-- application_documents
CREATE TABLE application_documents (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    document_name  TEXT NOT NULL,
    file_path      TEXT NOT NULL,
    uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- application_status_history
CREATE TABLE application_status_history (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    status         TEXT NOT NULL,
    changed_by     UUID NOT NULL REFERENCES users(id),
    changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment        TEXT
);

-- audit_logs
CREATE TABLE audit_logs (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type     TEXT NOT NULL,
    user_id        UUID NOT NULL REFERENCES users(id),
    application_id UUID REFERENCES applications(id),
    timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata       JSONB
);

CREATE INDEX ix_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX ix_audit_logs_timestamp ON audit_logs (timestamp);

-- notifications
CREATE TABLE notifications (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_notifications_user_id ON notifications (user_id);
