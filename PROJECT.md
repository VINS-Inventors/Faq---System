# 🖥️ FAQ & Ticket Management System — Full-Stack Technical Specification

This document details all backend architectures, databases, frontend components, client-side routing modules, chatbot engines, and scalability setups implemented in the **FAQ & Ticket Management System**.

---

## 🧭 1. Unified Database Layer & Repository Pattern (Backend)

The system uses a unified data connector in [db.js](file:///c:/code/vins/Faq---System/backend/config/db.js) that automatically negotiates and falls back through three database storage engines on startup:

```mermaid
graph TD
    Start[App Starts] --> CheckPG{1. PostgreSQL Available?}
    CheckPG -- Yes --> UsePG[🐘 Use PostgreSQL Engine]
    CheckPG -- No --> CheckMongo{2. MongoDB Available?}
    CheckMongo -- Yes --> UseMongo[🍃 Use MongoDB Engine]
    CheckMongo -- No --> UseLocal[📦 Use Local JSON Storage Fallback]
```

### Features:
1.  **ElephantSQL/PostgreSQL Engine:**
    *   Initiates connection pools using the `pg` library.
    *   Executes auto-migrations to initialize the tabular database schema (`users`, `queries`, `faqs`, `forums`, `posts`, `password_resets`) if tables do not exist.
    *   Defines indexes on target columns (e.g., password reset emails).
    *   Provides JSONB mappings for arrays/objects (`tags`, `attachments`, `linkedFAQs`, `votedBy`, `answers`, `helpfulVotes`, `notHelpfulVotes`).
2.  **Mongoose/MongoDB Engine:**
    *   Connects dynamically via Mongoose schema structures as a primary database fallback.
    *   Uses schema validations for constraints.
3.  **Local Storage JSON Engine (`localDb.js`):**
    *   Fallback zero-dependency local mock database storing data in `.json` files inside the [local_data/](file:///c:/code/vins/Faq---System/backend/local_data) directory.
    *   Implements an asynchronous query matching engine (`find`, `findOne`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`) that mirrors the Mongoose API.

---

## 🔐 2. Authentication, Security, & JWT Session Engine (Backend)

The authentication engine provides session isolation, secure password hashing, and role checks:

*   **Bcrypt Hashing:** Uses `bcryptjs` to salt and hash user passwords (rounds = 10) during registration and credential updates.
*   **JWT Bearer Tokens:** Signs and issues standard JSON Web Tokens on successful login, verifying caller identity in client request headers (`Authorization: Bearer <token>`).
*   **Access Middleware ([auth.js](file:///c:/code/vins/Faq---System/backend/middleware/auth.js)):**
    *   `auth`: Parses and validates tokens, binding the current user payload (`id`, `role`) to `req.user`.
    *   `adminOnly`: Guards route access to queries, database tables, and rosters, permitting only the `admin` role.

---

## 📧 3. Nodemailer Password Reset Flow (Backend)

Secures credentials recovery via token-based mail flows:

*   **Token Dispatcher:** Generates secure temporary tokens and stores them in the database with timestamps.
*   **Console Logging Fallback:** If `EMAIL_USER` or `EMAIL_PASS` is empty (Local/Dev mode), it automatically intercepts the reset flow and logs the validation url link directly to the console for development testing.
*   **Expiration Enforcement:** Validates temporary tokens and verifies token timestamp freshness within the `RESET_TOKEN_EXPIRY_MIN` window (defaulting to 15 minutes) before permitting credential changes.

---

## 🎫 4. Helpdesk Ticket Lifecycle Engine (Backend)

Controls the full ticketing pipeline from request submission to final solution publishing:

*   **Atomic Claim Engine:** Employs atomic operations to claim tickets. Moving status from `PENDING` to `REVIEWING` is restricted to one moderator, avoiding race conditions.
*   **Moderator Workspace:** Allows moderator assignees to post resolution answers and associate related FAQs (`linkedFAQs`).
*   **Query Helpful/Not Helpful Rating:**
    *   Logged-in users can rate resolved tickets using the `/helpful` route, voting `helpful` or `notHelpful`.
    *   Aggregates totals (`helpful` & `notHelpful` count fields) and records voter user IDs (`helpfulVotes`, `notHelpfulVotes` arrays) to prevent duplicate votes per query.
*   **Approval Pipeline:** Admins review resolved queries. Approvals change statuses to `APPROVED` and automatically trigger the compilation and publishing of a new FAQ entity based on the ticket details.
*   **Escalation and Rejection Queues:** Provides routes to escalate tickets back to administrative review (`ESCALATED` status) or flag them as `REJECTED` with reason fields.

---

## 💬 5. Chatbot Engine & LLM Proxy (Backend)

Supports smart chatbot workflows through two matching layers:

1.  **NLP Keyword Matching Layer:**
    *   Uses a content scoring algorithm in [chatbotController.js](file:///c:/code/vins/Faq---System/backend/controllers/chatbotController.js) to clean messages of common stop words.
    *   Scores matching keywords against the FAQ database and resolved query history. Returns high-confidence answers alongside automated related suggestions.
2.  **LLM Proxy Routing:**
    *   Acts as a fallback if keyword matching scores fall below confidence thresholds.
    *   Proxies messages directly to local generative AI API endpoints (e.g. vLLM or LM-Studio running on port `6006`).
3.  **Automatic Ticket Raising:**
    *   Detects user request intentions (e.g., "create ticket", "raise ticket") via keyword regex.
    *   Returns structured ticket drafting prompts and action parameters for the frontend to render form templates.

---

## 🏛️ 6. Discussion Forums & Community Q&A Threads (Backend)

Implements interactive community-based sharing boards:

*   **Query-Scoped Forums:** Houses conversations on specific queries, allowing users to coordinate, post messages, modify contents, or delete replies.
*   **Community Posts Board:**
    *   Enables public threads with text posts, tags, and vote metrics.
    *   Users submit answers, vote on posts/replies, and add custom text reactions (e.g., emoji reactions on solutions).
    *   Post authors can flag an answer as "Accepted", marking it as the official solution.

---

## 🗄️ 7. Administrative SQL Database Inspector (Backend)

Restricted backend inspector endpoints (`/api/db-view`) enabling real-time database administration:

*   **Row Counters:** Inspects and compiles row statistics across tables (`users`, `queries`, `faqs`, `forums`, `posts`).
*   **Dynamic SQL Builder:**
    *   Checks if active database adapter is PostgreSQL.
    *   Builds SQL expressions on the fly to perform server-side sorting (`sort`, `dir`), pagination (`limit`, `offset`), and columns search filters (`q`).
    *   Returns table metadata and row sets to the admin client.

---

## 🎨 8. User Interface Design & Aesthetics (Frontend)

Provides a premium user interface incorporating modern visual styling and fluid interactions:

*   **Glassmorphic Design Tokens:** Stylized theme-aware component grids utilizing backdrop filters (`backdrop-filter: blur()`), harmonic background gradients, translucent borders, and noise texture overlays (`.grain`).
*   **Smooth Page Transitions:** Configured via `AnimatePresence` and `motion.div` in [App.jsx](file:///c:/code/vins/Faq---System/frontend/src/App.jsx). Smoothly translates page routes along the vertical axis while fading scaling parameters.
*   **Theme Control:** Integrated theme selector switch ([ThemeToggle.jsx](file:///c:/code/vins/Faq---System/frontend/src/components/ThemeToggle.jsx)) toggling global CSS variables to switch between high-contrast dark and light modes.
*   **Floating Progress Scrollbar ([FloatingScrollbar.jsx](file:///c:/code/vins/Faq---System/frontend/src/components/FloatingScrollbar.jsx)):** Custom scroll component tracking viewport progression and mapping reading status visually.

---

## 🧩 9. Component Architecture & State Management (Frontend)

Organizes layouts, authentication contexts, and request interceptors:

*   **Context-Based Session Provider ([AuthContext.jsx](file:///c:/code/vins/Faq---System/frontend/src/context/AuthContext.jsx)):** Caches caller identity profiles and local storage authorization tokens globally. Handles asynchronous authentication requests.
*   **Axios Request Interceptor ([api.js](file:///c:/code/vins/Faq---System/frontend/src/utils/api.js)):** Sets up a central Axios caller client to intercept outbound requests, automatically embedding JWT keys inside `Authorization: Bearer <token>` headers.
*   **Protected Guard Wrappers ([ProtectedRoute.jsx](file:///c:/code/vins/Faq---System/frontend/src/components/ProtectedRoute.jsx)):** Guards navigation points, redirecting guest accounts to login frames and restricting administrative panels to verified `admin` profiles.

---

## 📁 10. Dashboard & View Configurations (Frontend)

*   **Public FAQ Directory ([FAQ.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/FAQ.jsx)):**
    *   Expandable accordion card panels highlighting categories and query tags.
    *   Interactive voting controls triggers matching `/helpful` APIs.
*   **Support Desk Dashboards:**
    *   [AskQuery.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/AskQuery.jsx): Submit portal equipped with description controls, category selectors, and urgency selectors.
    *   [QueryBoard.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/QueryBoard.jsx): Directory showing owned queries, current statuses, and resolution notes.
    *   [StatusTracker.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/StatusTracker.jsx): Real-time interactive timeline rendering the claim, review, and resolution actions of tickets.
*   **Moderator Review Panel ([AdminReview.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/AdminReview.jsx)):**
    *   Dynamic ticket queues split by pending and reviewing.
    *   Claiming interfaces, response inputs, related FAQ associations, and final approvals/rejections triggers.
*   **Administrative Tables Grid ([AdminDB.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/AdminDB.jsx)):**
    *   Interactive tabular grid showing statistical schemas of database tables.
    *   Drives queries parameters triggering server-side searching, sorting, and pagination.
*   **Community Forums & Posts ([Forum.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/Forum.jsx), [ForumPost.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/ForumPost.jsx)):**
    *   Group messaging feeds inside queries.
    *   Community QA threads listing, post upvote counters, answer replies, and author-assigned solution parameters.

---

## 📊 11. Database Migration Automation (`migrate.js`)

A custom loader script [migrate.js](file:///c:/code/vins/Faq---System/backend/config/migrate.js) to import files from the JSON database directory to PostgreSQL:
*   Loads local storage documents (`users.json`, `queries.json`, `faqs.json`, `posts.json`).
*   Normalizes schema columns (including default settings and JSONB parsing parameters).
*   Batch-upserts rows using `ON CONFLICT (_id) DO NOTHING` constraints to prevent data collisions.

---

## ⚖️ 12. High Availability & Load Balancing Architecture

Describes the scale-out capabilities and operational architecture for production hosting:

1.  **Horizontal Node.js Scaling (PM2 Cluster Mode):**
    *   Utilizes node process clustering to duplicate Express servers across multiple logical CPUs.
    *   Enforces internal socket sharing and TCP round-robin traffic routing natively.
2.  **Reverse Proxy Load Balancing (Nginx Upstream Routing):**
    *   Deploys upstream load balancer pools utilizing routing algorithms (`least_conn` for distributing requests to instances with the fewest active connections).
    *   Manages connection upgrades (WebSockets), HTTP proxy configurations, and client IP extraction headers (`X-Forwarded-For`, `X-Real-IP`).

