# 🍉 Crop Advisory — Admin Panel

A React (Vite) single-page admin dashboard for the Watermelon Crop Advisory
backend. Provides admin login, a stats dashboard, full CRUD for all reference
data (crops, stages, diseases, disease rules, risk levels, nutrient rules), and
management views for farmers and fields.

**Stack:** React 18 + Vite · React Router · Formik + Yup (validation) ·
axios (API) · react-toastify (notifications). Fully responsive (desktop +
mobile sidebar).

---

## 1. Setup

```bash
cd admin
npm install
```

Configure the backend URL in `.env` (already created):

```
VITE_API_BASE_URL=http://localhost:4000/api
```

Point this at your deployed backend if needed.

## 2. Run

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

> The backend must be running and seeded. Default admin credentials (from the
> backend seed): **admin@cropadvisory.com / Admin@12345**.

---

## 3. Features

| Area | Details |
| ---- | ------- |
| **Auth** | Admin login (`POST /admin/auth/login`). JWT stored in `localStorage`, attached to every request. Auto-logout + toast on `401`. Protected routes redirect to `/login`. |
| **Dashboard** | Total farmers, fields, advisories, active crops + weather sync status. |
| **Crops** | List / create / edit / delete. Search by name. |
| **Crop Stages** | CRUD with crop selector; validates `gddEnd ≥ gddStart`. |
| **Diseases** | CRUD with crop selector + description. |
| **Disease Rules** | CRUD with disease selector, parameter/operator selects, min/max/consecutive-days/score. |
| **Risk Levels** | CRUD with score range, level (LOW/MOD/HIGH badge), advisory text. |
| **Nutrient Rules** | CRUD with crop+stage selectors (stage list filtered by crop), nutrient/fertilizer/threshold/doses. |
| **Farmers** | List (with field counts) → detail (profile + their fields) → delete. |
| **Fields** | List (all farmers' fields) → detail → delete. |

All forms use **Formik + Yup** for client-side validation; the backend's Joi
validation errors are also surfaced as toasts. All mutations show success/error
**toast notifications** and refresh the table.

---

## 4. Project Structure

```
admin/
├── index.html
├── vite.config.js
├── .env                       # VITE_API_BASE_URL
└── src/
    ├── main.jsx               # entry: Router + AuthProvider + ToastContainer
    ├── App.jsx                # route table (public /login + protected layout)
    ├── api/
    │   ├── client.js          # axios instance, token store, 401 handling
    │   └── services.js        # typed API calls per resource (CRUD factory)
    ├── context/
    │   └── AuthContext.jsx    # login/logout/session state
    ├── hooks/
    │   ├── useFetch.js        # loading + reload helper
    │   └── useOptions.js      # loads crops/stages/diseases for selects
    ├── components/
    │   ├── Layout.jsx         # responsive shell (sidebar + topbar)
    │   ├── Sidebar.jsx        # grouped nav with active highlighting
    │   ├── ProtectedRoute.jsx
    │   ├── DataTable.jsx      # generic responsive table
    │   ├── CrudPage.jsx       # reusable list + create/edit modal + delete
    │   ├── FormField.jsx      # Formik-bound input/select/textarea + errors
    │   ├── Modal.jsx
    │   ├── ConfirmDialog.jsx
    │   └── Loader.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Crops.jsx  Stages.jsx  Diseases.jsx
    │   ├── DiseaseRules.jsx  RiskLevels.jsx  NutrientRules.jsx
    │   ├── Farmers.jsx  FarmerDetail.jsx
    │   └── Fields.jsx   FieldDetail.jsx
    └── styles/
        └── index.css          # design tokens + all component styles
```

### Design notes
- **`CrudPage`** is the workhorse: each reference-data page just supplies its
  columns, Yup schema, initial-values mapper, payload mapper, and form fields.
  This keeps the six CRUD screens consistent and DRY.
- **`api/services.js`** mirrors every backend admin endpoint; a `crud()` factory
  generates `list/get/create/update/remove` for the standard resources.
- The backend returns `{ success, message, data }`; the axios layer unwraps
  `data` automatically.
