# FAQ Management System

A full-stack FAQ Management System with 3-page workflow.

## Tech Stack

- **Frontend:** React 18 + Vite + React Router + Axios
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Bearer tokens)

## Project Structure

```
faq-system/
├── backend/
│   ├── config/db.js
│   ├── models/
│   │   ├── User.js
│   │   └── Query.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── queryController.js
│   │   └── userController.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── queries.js
│   │   └── users.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Auth.jsx        (Login / Register)
    │   │   ├── AskQuery.jsx    (Submit questions)
    │   │   ├── QueryBoard.jsx  (View own queries)
    │   │   └── AdminReview.jsx (Admin responds/rejects)
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/AuthContext.jsx
    │   ├── utils/api.js
    │   ├── App.jsx
    │   └── App.css
    ├── index.html
    └── package.json
```

## Setup & Run

### Prerequisites

- Node.js 18+
- MongoDB running on `localhost:27017`

### 1. Backend

```bash
cd faq-system/backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 2. Frontend

```bash
cd faq-system/frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. MongoDB Connection

Ensure MongoDB is running. Connection string is in `backend/.env`:

```
MONGO_URI=mongodb://localhost:27017/faq-system
```

Update `vite.config.js` proxy if backend runs on a different port.

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register (user or admin) |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/queries` | JWT | Submit a question |
| GET | `/api/queries` | JWT | Get own queries |
| GET | `/api/queries/all` | Admin | Get all queries |
| PUT | `/api/queries/:id/respond` | Admin | Answer or reject |
| DELETE | `/api/queries/:id` | JWT | Delete query |
| GET | `/api/users` | Admin | Get all users |

## 3-Page Workflow

1. **AskQuery (`/ask`)** — Any logged-in user submits a question with category
2. **QueryBoard (`/board`)** — User sees their own queries with status (pending/answered/rejected)
3. **AdminReview (`/admin`)** — Admin views all queries, can filter by status, answer or reject, and delete

## Roles

- **user** — Can ask questions, view own queries, delete pending queries
- **admin** — Full access to all queries, can answer/reject/delete any query

## Seed Admin Account

Register with role `admin` via the UI, or insert manually:

```js
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2a$10$...", // bcrypt hash of "admin123"
  role: "admin"
})
```
# Faq---System
