-- ============================================================
-- 005_ApplicationFriendlyIdAndMunicipalityShortname.sql
-- Municipality short codes + human-readable application IDs
-- ============================================================

-- YY in friendly IDs: two-digit Gregorian year from submitted_at (UTC).

ALTER TABLE municipalities
    ADD COLUMN shortname VARCHAR(5) NULL;

CREATE UNIQUE INDEX ix_municipalities_shortname_unique
    ON municipalities (shortname)
    WHERE shortname IS NOT NULL;

UPDATE municipalities
SET shortname = 'KTM'
WHERE name ILIKE '%kathmandu%';

ALTER TABLE applications
    ADD COLUMN friendly_application_id VARCHAR(255) NULL;

DO $$
DECLARE
    orphan_count int;
BEGIN
    SELECT COUNT(*)::int INTO orphan_count
    FROM applications a
             JOIN service_types st ON st.id = a.service_type_id
             JOIN municipalities m ON m.id = st.municipality_id
    WHERE m.shortname IS NULL;

    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Cannot backfill friendly_application_id: % application(s) belong to municipalities without shortname',
            orphan_count;
    END IF;
END $$;

-- Default NanoID alphabet (64 chars) — keep in sync with C# generator.
CREATE OR REPLACE FUNCTION _migration_nanoid6() RETURNS text AS
$$
DECLARE
    alphabet constant text := '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    result       text := '';
    i            int;
    idx          int;
BEGIN
    FOR i IN 1..6
        LOOP
            idx := 1 + floor(random() * 64)::int;
            result := result || substr(alphabet, idx, 1);
        END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

DO
$$
DECLARE
    r      RECORD;
    new_id text;
    yy     text;
BEGIN
    FOR r IN SELECT a.id,
                    a.submitted_at,
                    upper(trim(m.shortname)) AS mun
             FROM applications a
                      JOIN service_types st ON st.id = a.service_type_id
                      JOIN municipalities m ON m.id = st.municipality_id
        LOOP
            yy := TO_CHAR(r.submitted_at AT TIME ZONE 'UTC', 'YY');
            LOOP
                new_id := 'NP-' || r.mun || '-' || yy || '-' || _migration_nanoid6();
                EXIT WHEN NOT EXISTS (SELECT 1
                                      FROM applications
                                      WHERE friendly_application_id = new_id);
            END LOOP;
            UPDATE applications
            SET friendly_application_id = new_id
            WHERE id = r.id;
        END LOOP;
END
$$;

DROP FUNCTION IF EXISTS _migration_nanoid6();

ALTER TABLE applications
    ALTER COLUMN friendly_application_id SET NOT NULL;

CREATE UNIQUE INDEX ux_applications_friendly_application_id
    ON applications (friendly_application_id);
