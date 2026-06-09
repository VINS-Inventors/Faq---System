# Vicharanashala — FAQ & Community Platform

> Official internship FAQ portal for the Vicharanashala Lab, IIT Ropar.  
> Built with React + Express + PostgreSQL.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database](#database)
- [API Reference](#api-reference)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [User Roles](#user-roles)
- [Pages & Routes](#pages--routes)

---

## Overview

Vicharanashala is a centralized FAQ and query management platform for the VINS internship programme at IIT Ropar. It allows students to browse FAQs, submit queries, track their status, discuss on a community forum, and chat with an AI assistant (Yaksha) — all in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Framer Motion, Vite |
| Backend | Node.js, Express.js |
| Primary DB | PostgreSQL 18 (via `pg`) |
| Fallback DB | MongoDB (via Mongoose) |
| Last-resort fallback | Local JSON files |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Styling | Custom CSS — Wibify dark theme, neon lime accent |
| Fonts | Instrument Serif, Outfit, JetBrains Mono (Google Fonts) |

---

## Project Structure

```
faq-system/
├── backend/
│   ├── config/
│   │   ├── db.js              # Unified DB layer (PG → Mongo → JSON)
│   │   ├── localDb.js         # Local JSON fallback store
│   │   └── migrate.js         # One-shot migration script (JSON → PG)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatbotController.js
│   │   ├── faqController.js
│   │   ├── forumController.js
│   │   ├── postController.js
│   │   ├── queryController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js            # JWT verify + adminOnly guard
│   ├── models/                # Mongoose schemas (used when Mongo is active)
│   │   ├── FAQ.js
│   │   ├── Forum.js
│   │   ├── Post.js
│   │   ├── Query.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── faqRoutes.js
│   │   ├── forumRoutes.js
│   │   ├── postRoutes.js
│   │   ├── queries.js
│   │   └── users.js
│   ├── local_data/            # JSON fallback data files
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatBot.jsx        # Yaksha AI assistant
    │   │   ├── FloatingScrollbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── ThemeToggle.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── AdminDB.jsx        # Live DB viewer (admin)
    │   │   ├── AdminReview.jsx    # Query moderation (admin)
    │   │   ├── AskQuery.jsx       # Submit a query
    │   │   ├── Auth.jsx           # Login / Register
    │   │   ├── Escalation.jsx     # Escalated queries (admin)
    │   │   ├── FAQ.jsx            # FAQ accordion page
    │   │   ├── ForgotPassword.jsx
    │   │   ├── Forum.jsx          # Community forum list
    │   │   ├── ForumPost.jsx      # Single post + answers + reactions
    │   │   ├── Home.jsx           # Landing page
    │   │   ├── QueryBoard.jsx     # Public resolved Q&A board
    │   │   ├── ResetPassword.jsx
    │   │   ├── StatusTracker.jsx  # Track your query status
    │   │   └── Users.jsx          # User directory (admin)
    │   ├── utils/
    │   │   └── api.js             # Axios instance with JWT interceptor
    │   ├── App.css               # Full theme (dark + light mode)
    │   └── App.jsx               # Routes + AnimatePresence transitions
    ├── index.html
    └── package.json
```

---

## Features

### For Students (Users)
- **Submit Query** — raise a question with category, priority, and attachments
- **Knowledge Base** — browse all resolved & approved Q&As
- **FAQ Accordion** — searchable, filterable FAQ list with 👍/👎 voting
- **Status Tracker** — 4-step timeline showing query progress
- **Community Forum** — Stack Overflow-style Q&A with:
  - ▲▼ upvote/downvote on questions
  - 👍 Like + 💡 Insightful pinned reaction buttons on answers
  - ❤️ 🔥 🎯 additional reactions via emoji picker
  - ✓ Accept answer (question author only)
  - ✏️ Edit your own answers
  - 🔗 Share/copy link
  - Sort by Newest / Top Voted / Most Answered
  - Tag filtering + full-text search
- **Yaksha Chatbot** — FAQ-powered AI assistant (strict knowledge-base-only answers), ticket creation

### For Admins
- **Moderation Panel** — claim, resolve, approve, reject, escalate queries
- **Escalation Queue** — manage escalated queries
- **User Directory** — sortable, searchable table of all users
- **DB Viewer** — live paginated table view of all PostgreSQL tables
- **FAQ Management** — create, edit, delete FAQs

### Global
- Dark / Light mode toggle
- Framer Motion page transitions (fade + slide + scale)
- Grain texture overlay
- Neon lime scrollbar
- Floating radial blur orbs
- JWT authentication with 7-day tokens
- Forgot / Reset password flow

---

## Database

### Connection Priority
```
PostgreSQL → MongoDB → Local JSON
```
The server auto-detects which database is available at startup and logs:
- `🐘 Using PostgreSQL`
- `🍃 Using MongoDB`
- `📦 Using local JSON storage`

### PostgreSQL Tables

| Table | Description |
|---|---|
| `users` | Registered users with roles |
| `queries` | Student queries with full lifecycle |
| `faqs` | Published FAQ entries |
| `posts` | Forum posts with embedded answers & reactions |
| `forums` | Legacy discussion messages linked to queries |

All array/object fields (`tags`, `answers`, `votedBy`, `reactions`, etc.) are stored as `jsonb`.

### Migrate Local JSON → PostgreSQL
```bash
cd backend
node config/migrate.js
```

---

## API Reference

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login, returns JWT |
| GET | `/me` | Get current user |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password/:token` | Reset password |

### Queries — `/api/queries`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | User | Submit query |
| GET | `/board` | Public | All resolved queries |
| GET | `/my` | User | My queries |
| GET | `/pending` | Admin | Pending queue |
| GET | `/reviewing` | Admin | In-review queue |
| GET | `/escalated` | Admin | Escalated queue |
| POST | `/:id/claim` | Admin | Claim query |
| POST | `/:id/resolve` | Admin | Resolve with answer |
| POST | `/:id/approve` | Admin | Approve → publish to FAQ |
| POST | `/:id/reject` | Admin | Reject query |
| POST | `/:id/escalate` | Admin | Escalate query |

### FAQs — `/api/faqs`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all FAQs |
| GET | `/:id` | Public | Single FAQ |
| POST | `/` | Admin | Create FAQ |
| PUT | `/:id` | Admin | Update FAQ |
| DELETE | `/:id` | Admin | Delete FAQ |
| POST | `/:id/helpful` | User | Vote helpful/not helpful |

### Forum Posts — `/api/posts`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List posts (search, tag filter) |
| GET | `/:id` | Public | Single post (increments views) |
| POST | `/` | User | Create post |
| DELETE | `/:id` | Owner/Admin | Delete post |
| POST | `/:id/vote` | User | Upvote/downvote post |
| POST | `/:id/answers` | User | Add answer |
| PUT | `/:id/answers/:answerId` | Owner | Edit answer |
| DELETE | `/:id/answers/:answerId` | Owner/Admin | Delete answer |
| POST | `/:id/answers/:answerId/vote` | User | Vote on answer |
| POST | `/:id/answers/:answerId/react` | User | Emoji react (👍💡❤️🔥🎯) |
| POST | `/:id/answers/:answerId/accept` | Post owner | Accept/unaccept answer |

### Chatbot — `/api/chatbot`
| Method | Route | Description |
|---|---|---|
| POST | `/message` | Send message, get FAQ-based reply |
| POST | `/ticket` | Create support ticket from chat |

### Users — `/api/users`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | All users |

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 18 (primary) or MongoDB (fallback)

### 1. Clone
```bash
git clone https://github.com/VINS-Inventors/Faq---System.git
cd Faq---System
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
```

### 3. Frontend
```bash
cd frontend
npm install
```

### 4. Create PostgreSQL database
```bash
# In psql or via Node:
CREATE DATABASE faq_system;
# Tables are created automatically on first server start
```

### 5. Migrate existing data (optional)
```bash
cd backend
node config/migrate.js
```

---

## Environment Variables

Create `backend/.env` based on `.env.example`:

```env
PORT=5000
PG_URI=postgresql://postgres:<password>@localhost:5432/faq_system
MONGO_URI=mongodb://localhost:27017/faq-system
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## Running the Project

```bash
# Terminal 1 — Backend
cd backend
npm run dev       # nodemon (auto-restart)
# or
npm start         # plain node

# Terminal 2 — Frontend
cd frontend
npm run dev       # Vite dev server at http://localhost:5173
```

Backend runs on `http://localhost:5000`  
Frontend proxies `/api` to the backend via Vite config.

---

## User Roles

| Role | Permissions |
|---|---|
| `user` | Submit queries, browse FAQs/board, use forum, chat with Yaksha |
| `admin` | All user permissions + moderate queries, manage FAQs, view DB, manage users |

---

## Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/` | Landing (Home) | Public |
| `/login` | Login / Register | Public |
| `/forgot-password` | Forgot Password | Public |
| `/faq` | FAQ Accordion | Public |
| `/ask` | Submit Query | User |
| `/board` | Knowledge Base | User |
| `/status` | Status Tracker | User |
| `/forum` | Community Forum | User |
| `/forum/:id` | Forum Post Detail | User |
| `/admin` | Moderation Panel | Admin |
| `/escalation` | Escalation Queue | Admin |
| `/users` | User Directory | Admin |
| `/db` | DB Viewer | Admin |

---

## GitHub

**Repository:** https://github.com/VINS-Inventors/Faq---System  
**Branch:** `main`
