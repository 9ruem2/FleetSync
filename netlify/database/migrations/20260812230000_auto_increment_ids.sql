-- mock 데이터 제거 및 auto increment ID 스키마로 재구성
DROP TABLE IF EXISTS backup_assignments;
DROP TABLE IF EXISTS schedule_shifts;
DROP TABLE IF EXISTS drivers;

CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  route_number text NOT NULL,
  contract_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE schedule_shifts (
  id SERIAL PRIMARY KEY,
  driver_id integer NOT NULL REFERENCES drivers(id),
  date text NOT NULL,
  status text NOT NULL,
  UNIQUE (driver_id, date)
);

CREATE TABLE backup_assignments (
  id SERIAL PRIMARY KEY,
  date text NOT NULL,
  route_number text NOT NULL,
  original_driver_id integer NOT NULL REFERENCES drivers(id),
  original_driver_name text NOT NULL,
  backup_driver_id integer NOT NULL REFERENCES drivers(id),
  backup_driver_name text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_shifts_date ON schedule_shifts(date);
CREATE INDEX idx_backup_assignments_date ON backup_assignments(date);
