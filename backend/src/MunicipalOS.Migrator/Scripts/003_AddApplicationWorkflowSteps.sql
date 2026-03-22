CREATE TABLE application_workflow_steps (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id      UUID NOT NULL REFERENCES applications(id),
    workflow_step_id    UUID NOT NULL REFERENCES workflow_steps(id),
    step_order          INT  NOT NULL,
    status              TEXT NOT NULL DEFAULT 'Pending',
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_on         TIMESTAMPTZ,
    completed_by_user_id UUID REFERENCES users(id),
    completed_on        TIMESTAMPTZ,
    comment             TEXT
);

CREATE UNIQUE INDEX ix_application_workflow_steps_app_step
    ON application_workflow_steps (application_id, step_order);

CREATE INDEX ix_application_workflow_steps_status
    ON application_workflow_steps (status);
