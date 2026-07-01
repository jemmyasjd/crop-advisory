# 🍉 Watermelon Crop Advisory — Farmer Frontend

A React (Vite) web app for farmers to manage their fields and generate daily
crop advisories, fully integrated with the Crop Advisory backend.

**Stack:** React 18 + Vite · React Router · **Formik + Yup** (validation) ·
axios · react-toastify (notifications). Responsive (desktop + mobile navbar).

---

## 1. User Flow

```
Signup ─► (auto-login) ─► Create first Field ─► Field Detail ─► Get Advisory
                                                     │
Login ──► My Fields (cards) ─────────────────────────┘
              │
              └─► each field: view details, upload soil reports (optional),
                  generate advisory, view advisory history
```

- **New user:** Signup → automatically logged in → redirected straight to
  **Create Field** (a new farmer has no fields yet).
- **After creating a field:** lands on **Field Detail**, where weather has
  already been synced by the backend. Buttons: **Get Advisory**,
  **Upload Soil Report** (optional), Edit, Delete.
- **Advisory** works with or without a soil report — without one, the backend
  falls back to stage-default nutrient doses (the UI shows a hint to upload a
  report for personalized recommendations).
- **Returning user:** Login → **My Fields** (card grid).

## 2. Pages

| Page | Route | Backend |
| ---- | ----- | ------- |
| Signup | `/signup` | `POST /auth/signup` |
| Login | `/login` | `POST /auth/login` |
| My Fields | `/fields` | `GET /fields` |
| Create Field | `/fields/new` | `GET /crops`, `POST /fields` |
| Field Detail | `/fields/:id` | `GET /fields/:id`, soil reports, delete |
| Edit Field | `/fields/:id/edit` | `GET /fields/:id`, `PUT /fields/:id` |
| Advisory | `/fields/:id/advisory` | `GET /fields/:id/advisory` |
| Advisory History | `/fields/:id/advisories` | `GET /fields/:id/advisories` |
| Profile | `/profile` | `GET /profile`, `PUT /profile` |

The **Advisory** screen renders everything the backend computes: crop stage
(GDD, days after planting), weather summary, disease risk (score + level banner
+ per-rule evaluation table), nutrient recommendations (scaled field doses), and
the AI insights (summary, why-risk, precautions, fertilizer advice, next review).

## 3. Setup & Run

```bash
cd frontend
npm install
npm run dev        # http://localhost:5174
```

Backend URL comes from `.env` (default `http://localhost:4000/api`):

```
VITE_API_BASE_URL=http://localhost:4000/api
```

Build for production: `npm run build` (output in `dist/`).

> The backend must be running and seeded. Create a farmer account via the Signup
> page (or log in with an existing one).

## 4. Structure

```
frontend/src/
├── main.jsx                 # entry: Router + AuthProvider + ToastContainer
├── App.jsx                  # routes (public /login,/signup + protected layout)
├── api/
│   ├── client.js            # axios instance, token store, 401 auto-logout
│   └── services.js          # auth, profile, crops, fields, soil, advisory calls
├── context/AuthContext.jsx  # signup/login/logout/session
├── hooks/useFetch.js        # loading + reload helper
├── components/
│   ├── Navbar.jsx / Layout.jsx    # responsive top-navbar shell
│   ├── ProtectedRoute.jsx
│   ├── FormField.jsx        # Formik-bound input/select/textarea + errors
│   ├── FieldForm.jsx        # shared create/edit field form (Formik+Yup)
│   ├── SoilReportModal.jsx  # soil report upload form (Formik+Yup)
│   ├── AdvisoryView.jsx     # renders a full advisory payload
│   ├── Modal.jsx / ConfirmDialog.jsx / Loader.jsx
└── pages/
    ├── Signup.jsx  Login.jsx  Profile.jsx
    ├── MyFields.jsx  CreateField.jsx  EditField.jsx  FieldDetail.jsx
    └── Advisory.jsx  AdvisoryHistory.jsx
```

## 5. Validation

All forms use **Formik + Yup**, mirroring the backend's Joi rules so client and
server agree:
- **Signup:** name (2–100), valid email, password ≥ 6, phone optional.
- **Field:** name, crop (select), area > 0, planting date (not future),
  lat/long optional within valid ranges.
- **Soil report:** N/P/K ≥ 0, soil moisture 0–100 %, date not future.
- **Profile:** name required, phone optional, password optional (blank = keep).

Server-side validation errors are also surfaced as toasts, so nothing slips
through if the client checks are bypassed.
```
