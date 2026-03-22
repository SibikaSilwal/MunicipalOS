ALTER TABLE workflow_steps
    ADD COLUMN step_name        TEXT NOT NULL DEFAULT '',
    ADD COLUMN step_description TEXT;
