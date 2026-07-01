# 🍉 Watermelon Crop Advisory & Risk Engine

A full-stack application that generates **daily crop advisories** for Watermelon.
It tracks the crop's growth stage from accumulated heat units (GDD), scores
disease risk (Fusarium Wilt) from weather, recommends N/P/K fertilizer dosages
from a soil report scaled to field size, and produces a natural-language summary
via the **Groq AI** API.

This repository is a monorepo with three independent applications:

| Folder        | App                | Stack                       | Dev port | Description                                                        |
| ------------- | ------------------ | --------------------------- | -------- | ------------------------------------------------------------------ |
| [`backend/`](backend/)  | REST API           | Node.js, Express, PostgreSQL | `4000`   | Business logic, advisory/risk engines, auth, and all API endpoints. |
| [`frontend/`](frontend/) | Farmer web app     | React, Vite                 | `5174`   | Farmers manage fields, upload soil reports, and view advisories.    |
| [`admin/`](admin/)       | Admin panel        | React, Vite                 | `5173`   | Admins manage crops, stages, disease/nutrient rules, and users.     |

Each folder has its **own `README.md`** with deeper, app-specific detail. This
top-level README is the map and the quick-start.

---

## Architecture

```
                ┌──────────────┐        ┌──────────────┐
                │  frontend/   │        │    admin/    │
                │ (farmer app) │        │ (admin panel)│
                │  React :5174 │        │  React :5173 │
                └──────┬───────┘        └──────┬───────┘
                       │  HTTP / JSON (Bearer JWT)
                       └────────────┬───────────┘
                                    ▼
                          ┌───────────────────┐
                          │     backend/      │
                          │  Express API :4000│
                          │  advisory engines │
                          └─────────┬─────────┘
                                    ▼
                          ┌───────────────────┐
                          │    PostgreSQL     │   + Groq AI (summaries)
                          └───────────────────┘
```

Both frontends talk to the same backend API (`VITE_API_BASE_URL`,
default `http://localhost:4000/api`). The admin panel simply hits the
`/api/admin/*` routes, which require an `admin` role.

---

## Tech stack

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Backend        | Node.js, Express 5, PostgreSQL (`pg`)                         |
| Auth           | JWT (`jsonwebtoken`), `bcryptjs`, token stored in DB          |
| Validation     | Joi                                                           |
| AI summary     | Groq Chat Completions API                                     |
| API docs       | Swagger UI (`swagger-ui-express`) at `/api/docs`              |
| Frontend/Admin | React 18, Vite, React Router, Axios, Formik + Yup, React-Toastify |

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database (local or hosted, e.g. Aiven). A connection string is
  required by the backend.
- (Optional) a **Groq API key** for AI-generated advisory summaries — the
  backend falls back gracefully if it is not set.

---

## Quick start

Run each app in its own terminal. **Start the backend first** (both frontends
depend on it).

### 1. Backend — API + database

```bash
cd backend
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET, GROQ_API_KEY…
npm install
npm run db:setup              # runs migrate (schema.sql) + seed (datasets & admin user)
npm run dev                   # http://localhost:4000
```

- Health check: `GET http://localhost:4000/api/health`
- Interactive API docs (Swagger UI): `http://localhost:4000/api/docs`

### 2. Frontend — farmer web app

```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:5174
```

### 3. Admin — admin panel

```bash
cd admin
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:5173
```

The bootstrap admin account is created during `npm run db:setup` from the
backend's `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, defaults
`admin@cropadvisory.com` / `Admin@12345`). Use it to log into the admin panel.

---

## Environment variables

### `backend/.env`

| Variable         | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `PORT`           | API port (default `4000`)                            |
| `NODE_ENV`       | `development` / `production` / `test`                |
| `DATABASE_URL`   | PostgreSQL connection string                         |
| `PGSSL`          | `true` to require TLS (e.g. Aiven)                   |
| `JWT_SECRET`     | Secret used to sign JWTs                             |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`)                           |
| `GROQ_API_KEY`   | Groq API key for AI summaries (optional)             |
| `GROQ_MODEL`     | Groq model id (default `llama-3.3-70b-versatile`)    |
| `ADMIN_*`        | Bootstrap admin name / email / password (seed)       |

### `frontend/.env` and `admin/.env`

| Variable            | Description                                        |
| ------------------- | -------------------------------------------------- |
| `VITE_API_BASE_URL` | Backend API base URL (default `http://localhost:4000/api`) |

---

## How the advisory is calculated

The backend combines three deterministic engines plus an optional AI summary.
(Full detail lives in [`backend/README.md`](backend/README.md).)

1. **Crop stage (GDD)** — Accumulates Growing Degree Days from daily weather:
   `dailyGDD = max(((Tmax + Tmin) / 2) − Tbase, 0)`. Total GDD is matched
   against the crop's stage ranges (`gdd_start..gdd_end`) to find the current
   growth stage.

2. **Disease risk (Fusarium Wilt)** — Scores weather conditions against
   configurable rules (temperature, humidity, rainfall windows). The summed
   score maps to a risk level (Low / Medium / High) and an advisory message.

3. **Nutrient recommendation** — Looks up per crop + stage nutrient rules,
   compares the **latest soil report** N/P/K values to each threshold, picks the
   under- or above-threshold dose, and scales it to the field's area.

4. **AI summary** — Feeds the computed stage, risk, and nutrient results to Groq
   to produce a short natural-language advisory (falls back to a templated
   summary if no API key is configured).

The rule datasets (stages, risk rules, nutrient rules) are provided as JSON in
`backend/src/config/datasets/` and **seeded into the database**. At runtime the
engines read the live ruleset from the DB, so admins can edit rules through the
admin panel without redeploying.

---

## Deliverables map

| Deliverable        | Where                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| Database schema    | [`backend/src/db/schema.sql`](backend/src/db/schema.sql) (+ `migrate.js`) |
| Source code        | `backend/src/`, `frontend/src/`, `admin/src/`                         |
| Configurations     | [`backend/src/config/datasets/`](backend/src/config/datasets/) (JSON) |
| README / setup     | This file + per-app `README.md` in each folder                        |

---

## Repository layout

```
.
├── .gitignore          # root safety-net (each app also has its own)
├── README.md           # this file
├── backend/            # Express API + PostgreSQL + advisory engines
├── frontend/           # React farmer web app (Vite)
└── admin/              # React admin panel (Vite)
```
