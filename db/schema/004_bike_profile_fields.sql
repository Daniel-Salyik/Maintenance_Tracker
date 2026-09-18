ALTER TABLE bikes RENAME COLUMN model TO model_type;
ALTER TABLE bikes RENAME COLUMN year TO model_year;
ALTER TABLE bikes RENAME COLUMN serial_number TO frame_number;
ALTER TABLE bikes DROP COLUMN brand;
ALTER TABLE bikes ADD COLUMN description TEXT;
ALTER TABLE bikes ADD COLUMN specs JSONB NOT NULL DEFAULT '{}';
