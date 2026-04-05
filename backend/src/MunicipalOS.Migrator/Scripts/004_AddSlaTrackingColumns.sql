ALTER TABLE service_types
    ADD COLUMN expected_completion_minutes INT;

ALTER TABLE workflow_steps
    ADD COLUMN expected_completion_minutes INT;

ALTER TABLE applications
    ADD COLUMN due_at TIMESTAMPTZ;

ALTER TABLE application_workflow_steps
    ADD COLUMN expected_completion_minutes INT,
    ADD COLUMN due_at TIMESTAMPTZ;

CREATE INDEX ix_applications_due_at
    ON applications (due_at);

CREATE INDEX ix_application_workflow_steps_due_at
    ON application_workflow_steps (due_at);
