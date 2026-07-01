# 🍉 Watermelon Crop Advisory & Risk Engine — Backend

A Node.js / Express REST API that generates **daily crop advisories** for
Watermelon. It tracks the crop's growth stage from accumulated heat units (GDD),
scores disease risk (Fusarium Wilt) from weather, recommends N/P/K fertilizer
dosages from a soil report scaled to field size, and produces a natural-language
summary via the **Groq AI** API.

Data is persisted in **PostgreSQL** (Aiven cloud). Authentication is JWT-based
with the active token stored in the database so logout/rotation actually
invalidates sessions. All request bodies/params/queries are validated with
**Joi**.

---

## 1. Tech Stack

| Concern         | Choice                                    |
| --------------- | ----------------------------------------- |
| Runtime         | Node.js 18+ (uses global `fetch`)         |
| Web framework   | Express 5                                 |
| Database        | PostgreSQL (Aiven), `pg` driver + pool    |
| Auth            | JWT (`jsonwebtoken`) + `bcryptjs` hashing |
| Validation      | Joi (via `validate` middleware)           |
| AI summary      | Groq Chat Completions API                 |

---

## 2. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js                 # env-driven config
│   │   └── datasets/                # JSON configs (the provided datasets)
│   │       ├── watermelon_stages.json
│   │       ├── risk_rules.json
│   │       └── watermelon_nutrients.json
│   ├── db/
│   │   ├── pool.js                  # PG connection pool + transaction helper
│   │   ├── schema.sql               # full PostgreSQL schema (DDL)
│   │   ├── migrate.js               # runs schema.sql
│   │   └── seed.js                  # seeds reference data + bootstrap admin
│   ├── engines/                     # PURE business logic (unit-testable)
│   │   ├── cropStage.engine.js      # GDD accumulation + stage resolution
│   │   ├── diseaseRisk.engine.js    # rule-based 0-100 risk scoring
│   │   └── nutrient.engine.js       # threshold-based N/P/K dosing + scaling
│   ├── services/                    # orchestration + DB access
│   │   ├── auth.service.js
│   │   ├── profile.service.js
│   │   ├── field.service.js
│   │   ├── soilReport.service.js
│   │   ├── weather.service.js
│   │   ├── advisory.service.js      # ties the engines together
│   │   ├── crop.service.js
│   │   └── admin.service.js
│   ├── controllers/                 # thin HTTP layer
│   ├── routes/                      # route definitions + validation wiring
│   ├── middlewares/
│   │   ├── auth.js                  # authenticate + authorize(role)
│   │   ├── validate.js              # Joi validation middleware
│   │   └── error.js                 # 404 + central error handler
│   ├── validations/                 # Joi schemas per domain
│   ├── utils/                       # ApiError, response, jwt, asyncHandler, groqClient
│   ├── app.js                       # Express app wiring
│   └── server.js                    # HTTP server bootstrap
├── tests/
│   ├── engines.test.js              # pure-engine unit tests (no DB/network)
│   └── advisory.test.js             # end-to-end test against the live DB
├── .env / .env.example
└── package.json
```

**Layering:** `routes → (validate) → controllers → services → engines / db`.
Engines are pure functions with no I/O so the core math is independently testable.

---

## 3. Setup & Run

### Prerequisites
- Node.js **18+** (Node 22 recommended)
- A PostgreSQL database (the included `.env` points at the Aiven instance)

### Install
```bash
cd backend
npm install
```

### Configure
Environment is read from `.env` (already provided). Copy `.env.example` to make
your own if needed. Key variables:

| Variable          | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `PORT`            | HTTP port (default 4000)                             |
| `DATABASE_URL`    | PostgreSQL connection string                         |
| `PGSSL`           | `true` to enable TLS (Aiven requires it)             |
| `JWT_SECRET`      | signing secret for JWTs                              |
| `JWT_EXPIRES_IN`  | token lifetime (e.g. `7d`)                           |
| `GROQ_API_KEY`    | Groq API key (AI summary; falls back if empty)       |
| `GROQ_MODEL`      | Groq model id (default `llama-3.3-70b-versatile`)    |
| `ADMIN_*`         | bootstrap admin created on seed                      |

> **SSL note:** Aiven serves a self-signed CA chain. The pool connects with
> `ssl: { rejectUnauthorized: false }` and parses the connection string into
> discrete fields so the `sslmode=require` query param does not force
> `verify-full` (which would reject the chain).

### Create schema + seed reference data
```bash
npm run db:setup       # = npm run migrate && npm run seed
# or individually:
npm run migrate        # creates all tables (schema.sql)
npm run seed           # loads Watermelon crop, stages, disease rules, nutrients, admin
```

The seed creates a bootstrap admin (default `admin@cropadvisory.com` /
`Admin@12345`, overridable via `.env`).

### Run the server
```bash
npm run dev            # nodemon (auto-reload)
npm start              # production
```
Health check: `GET http://localhost:4000/api/health`

Interactive API docs (Swagger UI): `http://localhost:4000/api/docs`
Raw OpenAPI 3.0 spec (JSON): `http://localhost:4000/api/docs.json`

### Run tests
```bash
node tests/engines.test.js     # pure engine unit tests (offline)
npm test                       # end-to-end advisory test (needs DB seeded)
```

---

## 4. How the advisory is calculated

`GET /api/fields/:fieldId/advisory` runs the following pipeline
(`advisory.service.js`):

### A. Crop Stage (GDD) — `cropStage.engine.js`
For every day since planting:

```
dailyGDD = max( ((Tmax + Tmin) / 2) − Tbase , 0 )      Tbase = 12°C for Watermelon
totalGDD = Σ dailyGDD
```

The accumulated GDD is matched against the `crop_stages` ranges
(`gdd_start..gdd_end`) to find the current stage.

### B. Disease Risk (Fusarium Wilt) — `diseaseRisk.engine.js`
Rules live in `disease_risk_rules` (configurable, not hard-coded). Each rule
that matches adds its `score` (cumulative, clamped 0–100) over a **3-day weather
window** + today's soil moisture:

| Rule         | Parameter         | Condition                          | Score |
| ------------ | ----------------- | ---------------------------------- | ----- |
| Temperature  | `avg_temperature` | 3-day average between 20–28 °C     | +40   |
| Humidity     | `humidity`        | ≥ 85 % on **3 consecutive** days   | +30   |
| Soil Moisture| `soil_moisture`   | today ≥ 90 % capacity              | +30   |

Score → level via `disease_risk_levels`:
`≥70 HIGH`, `40–69 MODERATE`, `<40 LOW`, each with its advisory message.

### C. Nutrient Recommendation — `nutrient.engine.js`
1. Determine the current stage (from B above).
2. Look up `nutrient_rules` for that crop + stage.
3. For each nutrient, compare the **latest soil report** value to the threshold:
   - soil value `< threshold` → **below** → `dose_under_threshold` (deficient)
   - soil value `≥ threshold` → **above** → `dose_above_threshold` (sufficient)
   - no soil report → personalized recommendation falls back to the stage
     default (under-threshold dose).
4. Scale to the field: `fieldDoseKg = dosePerHectare × areaHectare`.

### D. AI Summary — `utils/groqClient.js`
The structured advisory is sent to Groq for a farmer-friendly summary
(`summary`, `whyRiskIsHigh`, `precautions[]`, `fertilizerAdvice`, `nextReview`).
**Fails soft:** if the key is missing or the call errors, a deterministic
rule-based fallback is returned so the endpoint never breaks.

The full advisory is also snapshotted into the `advisories` table for history
(`GET /api/fields/:fieldId/advisories`).

---

## 5. Verification scenario (Section 2.4)

The required test case is asserted in `tests/advisory.test.js` (live DB) and
`tests/engines.test.js` (pure). Inputs: planted Day 0, today Day 3, Rabi, 4.5 ha,
soil moisture 92 %, soil N=120 P=65 K=190, and the 3-day weather log.

| Output                | Expected                              | ✓ |
| --------------------- | ------------------------------------- | -- |
| GDD                   | 39                                    | ✓ |
| Stage                 | Germination & Emergence               | ✓ |
| Days after planting   | 3                                     | ✓ |
| Avg temperature       | 25 °C                                 | ✓ |
| Avg humidity          | 87.33 %                               | ✓ |
| Fusarium Wilt score   | 100 → **HIGH**                        | ✓ |
| Nitrogen  (120 < 150) | Below → 110 × 4.5 = **495 kg**        | ✓ |
| Phosphorus(65 ≥ 50)   | Above → 50 × 4.5 = **225 kg**         | ✓ |
| Potash    (190 ≥ 180) | Above → 30 × 4.5 = **135 kg**         | ✓ |

---

## 6. Authentication

- Passwords are hashed with bcrypt; never returned.
- On signup/login a JWT is signed and **stored on the user row**
  (`token`, `token_expiry`).
- `authenticate` middleware verifies the JWT signature **and** checks it matches
  the stored token, so logout (`token = NULL`) invalidates the session.
- `authorize('admin')` guards all admin routes.

Send the token as: `Authorization: Bearer <token>`.

---

## 7. API Reference

Base URL: `/api`

### Auth
| Method | Path                  | Auth | Body |
| ------ | --------------------- | ---- | ---- |
| POST   | `/auth/signup`        | —    | `{name,email,password,phone?}` |
| POST   | `/auth/login`         | —    | `{email,password}` |
| POST   | `/admin/auth/login`   | —    | `{email,password}` (admin only) |
| POST   | `/auth/logout`        | ✔    | — |

### Profile (farmer)
| Method | Path        | Auth |
| ------ | ----------- | ---- |
| GET    | `/profile`  | ✔ |
| PUT    | `/profile`  | ✔ — `{name?,phone?,password?}` |

### Fields (owned by the authenticated farmer)
| Method | Path                | Auth |
| ------ | ------------------- | ---- |
| POST   | `/fields`           | ✔ — `{name,cropId,season,areaHectare,plantingDate,latitude?,longitude?}` |
| GET    | `/fields`           | ✔ |
| GET    | `/fields/:fieldId`  | ✔ |
| PUT    | `/fields/:fieldId`  | ✔ |
| DELETE | `/fields/:fieldId`  | ✔ |

> On field creation the last 3 days of weather are fetched/synced and stored.

### Soil Reports
| Method | Path                                   | Auth |
| ------ | -------------------------------------- | ---- |
| POST   | `/fields/:fieldId/soil-reports`        | ✔ — `{nitrogen,phosphorus,potassium,soilMoisture?,reportDate?}` |
| GET    | `/fields/:fieldId/soil-reports/latest` | ✔ |
| GET    | `/fields/:fieldId/soil-reports`        | ✔ |
| DELETE | `/soil-reports/:id`                    | ✔ |

### Advisory
| Method | Path                            | Auth |
| ------ | ------------------------------- | ---- |
| GET    | `/fields/:fieldId/advisory`     | ✔ — generates + stores advisory |
| GET    | `/fields/:fieldId/advisories`   | ✔ — advisory history |

### Crops (farmer-facing)
| Method | Path                          | Auth |
| ------ | ----------------------------- | ---- |
| GET    | `/crops`                      | ✔ |
| GET    | `/crops/:cropId/stages`       | ✔ |
| GET    | `/crops/:cropId/diseases`     | ✔ |

### Admin (role: admin)
Dashboard: `GET /admin/dashboard`

Full CRUD under `/admin` for:
`crops`, `stages`, `diseases`, `disease-rules`, `risk-levels`, `nutrient-rules`
(`GET` list, `POST` create, `PUT /:id`, `DELETE /:id`).

Management:
- `GET /admin/farmers`, `GET /admin/farmers/:id`, `DELETE /admin/farmers/:id`
- `GET /admin/fields`, `GET /admin/fields/:id`, `DELETE /admin/fields/:id`

---

## 8. Example: end-to-end flow

```bash
# 1. Signup
curl -X POST localhost:4000/api/auth/signup -H 'Content-Type: application/json' \
  -d '{"name":"Ramesh","email":"ramesh@test.com","password":"pass1234"}'
# -> { data: { token, user } }

TOKEN=...   # from the response

# 2. Create a field (weather auto-synced)
curl -X POST localhost:4000/api/fields -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Farm 1","cropId":1,"season":"Rabi","areaHectare":4.5,"plantingDate":"2026-06-26","latitude":22.3072,"longitude":73.1812}'

# 3. Upload a soil report
curl -X POST localhost:4000/api/fields/1/soil-reports -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nitrogen":120,"phosphorus":65,"potassium":190,"soilMoisture":92}'

# 4. Generate the advisory
curl localhost:4000/api/fields/1/advisory -H "Authorization: Bearer $TOKEN"
```

---

## 9. Database schema overview

Entities (see `src/db/schema.sql`):

- `users` — farmers + admins; stores `password_hash`, `role`, active `token` + `token_expiry`.
- `crops` — supported crops + `base_temperature` (Tbase).
- `crop_stages` — GDD ranges per crop (the stage metadata).
- `diseases` → `disease_risk_rules` (scoring rules) → `disease_risk_levels` (score→level).
- `nutrient_rules` — per crop+stage thresholds and under/above doses.
- `fields` — **belongs to a user** (`user_id`); a user can have many fields.
- `soil_reports`, `weather_records` — time-series per field.
- `advisories` — JSON snapshots of generated advisories (history).

All reference/threshold data is stored in tables (and editable via the admin
API) rather than hard-coded, matching the assignment's design intent.
```
