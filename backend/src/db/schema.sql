-- =============================================================================
--  Watermelon Crop Advisory & Risk Engine - PostgreSQL schema
-- =============================================================================
--  Run with:  npm run migrate
--  Idempotent: safe to run repeatedly (DROP ... IF EXISTS then CREATE).
-- =============================================================================

-- Drop in dependency order ---------------------------------------------------
DROP TABLE IF EXISTS advisories          CASCADE;
DROP TABLE IF EXISTS weather_records      CASCADE;
DROP TABLE IF EXISTS soil_reports         CASCADE;
DROP TABLE IF EXISTS fields               CASCADE;
DROP TABLE IF EXISTS nutrient_rules       CASCADE;
DROP TABLE IF EXISTS disease_risk_levels  CASCADE;
DROP TABLE IF EXISTS disease_risk_rules   CASCADE;
DROP TABLE IF EXISTS diseases             CASCADE;
DROP TABLE IF EXISTS crop_stages          CASCADE;
DROP TABLE IF EXISTS crops                CASCADE;
DROP TABLE IF EXISTS users                CASCADE;

-- Shared trigger to keep updated_at fresh ------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
--  1. users  (farmers + admins; JWT stored in DB for validation/logout)
-- =============================================================================
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,
  role          VARCHAR(20)         NOT NULL DEFAULT 'farmer',  -- 'farmer' | 'admin'
  phone         VARCHAR(20),
  token         TEXT,                       -- current active JWT (null after logout)
  token_expiry  TIMESTAMPTZ,                -- expiry of the active token
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
--  2. crops
-- =============================================================================
CREATE TABLE crops (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  base_temperature NUMERIC(5,2) NOT NULL,   -- Tbase for GDD
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_crops_updated
  BEFORE UPDATE ON crops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
--  3. crop_stages  (watermelon_stages.json)
-- =============================================================================
CREATE TABLE crop_stages (
  id         SERIAL PRIMARY KEY,
  crop_id    INT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  stage_name VARCHAR(150) NOT NULL,
  gdd_start  INT NOT NULL,
  gdd_end    INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_crop_stages_crop ON crop_stages(crop_id);

-- =============================================================================
--  4. diseases
-- =============================================================================
CREATE TABLE diseases (
  id           SERIAL PRIMARY KEY,
  crop_id      INT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  disease_name VARCHAR(150) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_diseases_crop ON diseases(crop_id);

-- =============================================================================
--  5. disease_risk_rules  (risk_rules.json, configurable)
-- =============================================================================
CREATE TABLE disease_risk_rules (
  id               SERIAL PRIMARY KEY,
  disease_id       INT NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  rule_name        VARCHAR(100) NOT NULL,
  parameter        VARCHAR(100) NOT NULL,   -- avg_temperature | humidity | soil_moisture
  operator         VARCHAR(30)  NOT NULL,   -- BETWEEN | GTE | LTE | GT | LT | EQ
  min_value        NUMERIC(10,2),
  max_value        NUMERIC(10,2),
  consecutive_days INT,                     -- e.g. humidity must hold for N days
  score            INT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_risk_rules_disease ON disease_risk_rules(disease_id);

-- =============================================================================
--  6. disease_risk_levels  (score -> level + advisory)
-- =============================================================================
CREATE TABLE disease_risk_levels (
  id         SERIAL PRIMARY KEY,
  disease_id INT NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  min_score  INT NOT NULL,
  max_score  INT NOT NULL,
  risk_level VARCHAR(20) NOT NULL,          -- LOW | MODERATE | HIGH
  advisory   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_risk_levels_disease ON disease_risk_levels(disease_id);

-- =============================================================================
--  7. nutrient_rules  (watermelon_nutrients.json)
-- =============================================================================
CREATE TABLE nutrient_rules (
  id                   SERIAL PRIMARY KEY,
  crop_id              INT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  stage_id             INT NOT NULL REFERENCES crop_stages(id) ON DELETE CASCADE,
  season               VARCHAR(50),
  nutrient             VARCHAR(50)  NOT NULL,  -- Nitrogen | Phosphorus | Potash
  fertilizer           VARCHAR(150) NOT NULL,
  soil_threshold       NUMERIC(10,2) NOT NULL,
  dose_under_threshold NUMERIC(10,2) NOT NULL,
  dose_above_threshold NUMERIC(10,2) NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_nutrient_rules_crop_stage ON nutrient_rules(crop_id, stage_id);

-- =============================================================================
--  8. fields  (belongs to a user/farmer)
-- =============================================================================
CREATE TABLE fields (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_id       INT NOT NULL REFERENCES crops(id),
  name          VARCHAR(150) NOT NULL,
  season        VARCHAR(50),
  area_hectare  NUMERIC(10,2) NOT NULL,
  planting_date DATE NOT NULL,
  latitude      NUMERIC(10,7),
  longitude     NUMERIC(10,7),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fields_user ON fields(user_id);
CREATE TRIGGER trg_fields_updated
  BEFORE UPDATE ON fields
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
--  9. soil_reports
-- =============================================================================
CREATE TABLE soil_reports (
  id            SERIAL PRIMARY KEY,
  field_id      INT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  report_date   DATE NOT NULL,
  nitrogen      NUMERIC(10,2),
  phosphorus    NUMERIC(10,2),
  potassium     NUMERIC(10,2),
  soil_moisture NUMERIC(10,2),               -- % of capacity
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_soil_reports_field ON soil_reports(field_id, report_date DESC);

-- =============================================================================
--  10. weather_records
-- =============================================================================
CREATE TABLE weather_records (
  id           SERIAL PRIMARY KEY,
  field_id     INT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  weather_date DATE NOT NULL,
  tmax         NUMERIC(5,2),
  tmin         NUMERIC(5,2),
  humidity     NUMERIC(5,2),
  rainfall     NUMERIC(5,2),
  et0          NUMERIC(5,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (field_id, weather_date)
);
CREATE INDEX idx_weather_field_date ON weather_records(field_id, weather_date DESC);

-- =============================================================================
--  11. advisories  (history of generated advisories)
-- =============================================================================
CREATE TABLE advisories (
  id           SERIAL PRIMARY KEY,
  field_id     INT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gdd          NUMERIC(10,2),
  stage_name   VARCHAR(150),
  payload      JSONB NOT NULL              -- full advisory JSON snapshot
);
CREATE INDEX idx_advisories_field ON advisories(field_id, generated_at DESC);
