# 📖 Premium FAQ & Ticket Management System

Welcome to the **FAQ & Ticket Management System**—a modern, enterprise-grade, full-stack knowledge base and helpdesk application. This application bridges the gap between self-service information retrieval (via FAQs & a smart chatbot) and dedicated user assistance (via ticket creation, moderating workflows, status tracking, escalations, and discussion forums).

The system is fully animated and responsive, built with sleek modern UI paradigms including fluid glassmorphism, dynamic scrolling helpers, real-time query logs, customizable themes, and smooth page transitions.

---

## 🚀 Key Features

*   **Smart Chatbot Interface:** Built-in NLP keyword matching and suggestions to quickly answer placement and internship queries, with full local LLM proxy integration support (e.g. vLLM or LM-Studio). Features automated support ticket raising directly from the chat prompt.
*   **Helpdesk Ticket Lifecycle:** A complete workflow where users submit queries, moderators claim them to review, resolve them with answers, and admins approve resolutions (which automatically creates official FAQs) or reject queries.
*   **Discussion Forums & Community QA:** Interactive thread board allowing users to create posts, upvote threads, provide answers, comment/reply, react, and accept the best answers.
*   **PostgreSQL Database Viewer:** Dedicated secure database viewer page for admins, enabling server-side pagination, searching, sorting, and metadata inspection of all database tables.
*   **Unified Database Driver:** Auto-negotiates connection between **PostgreSQL**, **MongoDB**, and **Local JSON storage** dynamically on startup, ensuring zero-configuration fallback.
*   **Interactive Ticket Tracking:** Interactive timelines for checking the live claim, review, resolution, and escalation history of submitted tickets.
*   **Secure Authentication & Reset:** JSON Web Token (JWT) bearer-token authentication flow, complete with password recovery emails via SMTP (Nodemailer) and expiration-validated reset tokens.

---

## 🛠️ Technology Stack

### Backend
*   **Core Framework:** Node.js + Express.js
*   **Databases Supported:**
    *   **PostgreSQL** (via [pg](https://node-postgres.com/))
    *   **MongoDB** (via [Mongoose](https://mongoosejs.com/))
    *   **Local File Storage** (custom JSON database wrapper)
*   **Authentication & Hashing:** JWT (jsonwebtoken) + bcryptjs
*   **Mailing System:** Nodemailer (SMTP password reset flow)
*   **Process Manager:** Nodemon (Development hot reloading)

### Frontend
*   **Core UI Library:** React 18 + Vite
*   **Routing:** React Router DOM (v6)
*   **Client Communication:** Axios (interceptor injected with JWT tokens)
*   **Animations:** Framer Motion (page transitions & gesture animations)
*   **Styling:** Custom modern CSS (theme variables, dark/light modes, animations)

---

## 📁 Detailed Project Structure

```
faq-system/
├── backend/
│   ├── config/
│   │   ├── db.js             (Unified data layer connector: pg -> mongo -> local)
│   │   └── localDb.js         (JSON file database implementation)
│   ├── controllers/
│   │   ├── authController.js     (Login, register, forgot/reset password logic)
│   │   ├── chatbotController.js  (KB scoring algorithm & ticket drafting)
│   │   ├── faqController.js      (FAQ listing, modification & helpful votes)
│   │   ├── forumController.js    (Discussion forum message CRUD)
│   │   ├── postController.js     (Community QA, threads, votes, accepted answers)
│   │   ├── queryController.js    (Ticket lifecycle: claim, resolve, approve, reject)
│   │   └── userController.js     (Admin user listing & deletion management)
│   ├── middleware/
│   │   └── auth.js           (JWT parsing & role security verification)
│   ├── models/
│   │   ├── FAQ.js            (Mongoose FAQ Schema)
│   │   ├── Forum.js          (Mongoose Forum Schema)
│   │   ├── Post.js           (Mongoose Community QA Schema)
│   │   ├── Query.js          (Mongoose Query/Ticket Schema)
│   │   └── User.js           (Mongoose User Schema)
│   ├── routes/
│   │   ├── auth.js           (Auth endpoint bindings)
│   │   ├── chatbot.js        (Chatbot & LLM proxy endpoints)
│   │   ├── dbView.js         (Admin PostgreSQL tables viewer endpoints)
│   │   ├── faqRoutes.js      (FAQ endpoints)
│   │   ├── forumRoutes.js    (Forum discussion endpoints)
│   │   ├── postRoutes.js     (Community posts endpoints)
│   │   ├── queries.js        (Queries & Tickets workflow endpoints)
│   │   └── users.js          (User management endpoints)
│   ├── server.js             (App startup & route configuration)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatBot.jsx            (Slide-in floating chatbot widget)
    │   │   ├── FloatingScrollbar.jsx  (Custom animated progress indicator)
    │   │   ├── Footer.jsx             (Theme-aware responsive footer)
    │   │   ├── Navbar.jsx             (Navigation bar with session states)
    │   │   ├── ProtectedRoute.jsx     (Auth & admin permission wrapper)
    │   │   └── ThemeToggle.jsx        (Glassmorphic light/dark mode switch)
    │   ├── context/
    │   │   └── AuthContext.jsx        (Global authentication provider)
    │   ├── pages/
    │   │   ├── AdminDB.jsx            (PostgreSQL database inspection grid)
    │   │   ├── AdminReview.jsx        (Moderation workflow dashboard)
    │   │   ├── AskQuery.jsx           (Support ticket submit interface)
    │   │   ├── Auth.jsx               (Animated login & registration page)
    │   │   ├── Escalation.jsx         (Admin priority escalation queue)
    │   │   ├── FAQ.jsx                (Expandable public Q&A directory)
    │   │   ├── ForgotPassword.jsx     (Password recovery request)
    │   │   ├── Forum.jsx              (Discussions list & thread initiation)
    │   │   ├── ForumPost.jsx          (Thread viewer with nested answers & voting)
    │   │   ├── Home.jsx               (Fluid glassmorphism landing hub)
    │   │   ├── QueryBoard.jsx         (Personal ticket logs dashboard)
    │   │   ├── ResetPassword.jsx      (Secure new password entry form)
    │   │   ├── StatusTracker.jsx      (Ticket timeline history tracker)
    │   │   └── Users.jsx              (Admin user roster control panel)
    │   ├── utils/
    │   │   └── api.js                 (Axios configuration with token interceptors)
    │   ├── App.css                    (Modern UI design system stylesheet)
    │   ├── App.jsx                    (React Router routes & Framer transition settings)
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## ⚙️ Environment Configuration

Copy `backend/.env.example` to `backend/.env` and adjust setup configurations:

```ini
PORT=5000
PG_URI=postgresql://postgres:password@localhost:5432/faq_system
MONGO_URI=mongodb://localhost:27017/faq-system
JWT_SECRET=your-secure-jwt-secret-key-here

# 📧 SMTP Configuration (Nodemailer)
# Leave EMAIL_USER and EMAIL_PASS empty to log reset links directly to console.
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="VINS FAQ System Support" <your_email@gmail.com>

# Password Reset link expiry (in minutes)
RESET_TOKEN_EXPIRY_MIN=15
FRONTEND_URL=http://localhost:3000

# Optional: Custom LLM Endpoint Key (if using local LLM model fallback)
LLM_API_KEY=lm-studio
```

---

## ⚡ Setup & Execution

### 1. Database Provisioning
The application initiates databases in the following hierarchy on startup:
1.  **PostgreSQL:** Tries to connect to `PG_URI`. Auto-generates the database schema (`users`, `queries`, `faqs`, `forums`, `posts`, `password_resets`) if not present.
2.  **MongoDB:** Fallback. Connects to `MONGO_URI` if PostgreSQL is unavailable.
3.  **Local Storage:** Fallback. Stores data in JSON files in [backend/local_data/](file:///c:/code/vins/Faq---System/backend/local_data) if no database servers are reachable.

### 2. Run the Backend Server
```bash
cd backend
npm install
npm run dev
# Starts backend server on http://localhost:5000
```

### 3. Run the Frontend Development Server
```bash
cd frontend
npm install
npm run dev
# Starts local Vite client on http://localhost:3000
```

---

## 🛡️ User Roles & Query Workflow

The application supports three role categories:
*   **Public/Guest:** Access to the landing page, Chatbot, and reading the public FAQ board.
*   **User:** Access to ticket submission, personal ticket tracking logs, voting, and interacting in forums.
*   **Admin/Moderator:** Claiming tickets, escalating priority, resolving tickets, database viewing, and deleting content.

### Query State Machine
```
   [User Submits Query] ──> (PENDING)
                                │
                                └──> Claimed by Moderator ──> (REVIEWING)
                                                                 │
                                ┌────────────────────────────────┴──────────────┐
                                ▼                                               ▼
                         (RESOLVED) ──> Admin Approves ──> [Official FAQ]    (REJECTED)
                                │
                                └──> Admin Escalate ──> (ESCALATED)
```

---

## 📋 Comprehensive API Route Matrix

| Category | HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | None | Create a new user or admin account |
| | `POST` | `/api/auth/login` | None | Authenticate credentials & return JWT |
| | `GET` | `/api/auth/me` | JWT (Any) | Retrieve logged-in user profile details |
| | `POST` | `/api/auth/forgot-password` | None | Dispatch password reset token link |
| | `GET` | `/api/auth/reset-validate/:token` | None | Check validity of reset token |
| | `POST` | `/api/auth/reset-password` | None | Update credentials using token |
| **Queries** | `GET` | `/api/queries/board` | None | Get approved FAQ records |
| | `GET` | `/api/queries/mine` | JWT (User) | Retrieve user's submitted tickets |
| | `GET` | `/api/queries/:id` | None | Retrieve query details by ID |
| | `POST` | `/api/queries/:id/helpful` | JWT (Any) | Vote helpful/not-helpful on ticket query |
| | `POST` | `/api/queries` | JWT (User) | Open/Submit a new ticket query |
| | `PUT` | `/api/queries/:id/claim` | JWT (Admin) | Claim pending ticket -> `REVIEWING` |
| | `PUT` | `/api/queries/:id/resolve` | JWT (Admin) | Input resolution answer -> `RESOLVED` |
| | `PUT` | `/api/queries/:id/escalate` | JWT (Admin) | Flag resolution for escalation -> `ESCALATED` |
| | `PUT` | `/api/queries/:id/approve` | JWT (Admin) | Approve resolution answer -> FAQ entry |
| | `PUT` | `/api/queries/:id/reject` | JWT (Admin) | Flag ticket as rejected -> `REJECTED` |
| | `GET` | `/api/queries/admin/pending` | JWT (Admin) | Fetch pending ticket queue |
| | `GET` | `/api/queries/admin/escalated` | JWT (Admin) | Fetch escalated ticket queue |
| | `GET` | `/api/queries/admin/reviewing` | JWT (Admin) | Fetch claimed/reviewing ticket queue |
| **FAQs** | `GET` | `/api/faqs` | None | List/search all FAQ entries |
| | `GET` | `/api/faqs/:id` | None | Fetch single FAQ details by ID |
| | `POST` | `/api/faqs/:id/helpful` | JWT (Any) | Vote helpful/not-helpful on FAQ |
| | `POST` | `/api/faqs` | JWT (Admin) | Direct creation of FAQ entry |
| | `PUT` | `/api/faqs/:id` | JWT (Admin) | Modify existing FAQ contents |
| | `DELETE` | `/api/faqs/:id` | JWT (Admin) | Delete FAQ entry |
| **Forums** | `POST` | `/api/forum` | JWT (Any) | Post nested message on a query forum |
| | `GET` | `/api/forum/:queryId` | None | Retrieve discussion logs for a query |
| | `PUT` | `/api/forum/:id` | JWT (Author) | Modify a forum comment message |
| | `DELETE` | `/api/forum/:id` | JWT (Author) | Delete a comment message |
| **Posts** | `GET` | `/api/posts` | None | Get community QA post threads |
| | `GET` | `/api/posts/:id` | None | Fetch single post thread detail |
| | `POST` | `/api/posts` | JWT (Any) | Initiate new community QA thread |
| | `DELETE` | `/api/posts/:id` | JWT (Author) | Delete community thread |
| | `POST` | `/api/posts/:id/vote` | JWT (Any) | Upvote/Downvote thread |
| | `POST` | `/api/posts/:id/answers` | JWT (Any) | Submit reply answer on thread |
| | `POST` | `/api/posts/:id/answers/:answerId/vote` | JWT (Any) | Vote on a reply answer |
| | `PUT` | `/api/posts/:id/answers/:answerId` | JWT (Author) | Edit reply answer message |
| | `POST` | `/api/posts/:id/answers/:answerId/react` | JWT (Any) | Add reaction to reply answer |
| | `POST` | `/api/posts/:id/answers/:answerId/accept` | JWT (Author) | Mark answer as Accepted Solution |
| | `DELETE` | `/api/posts/:id/answers/:answerId` | JWT (Author) | Delete reply answer |
| **Chatbot** | `POST` | `/api/chatbot/message` | None | Send chat message to NLP resolver |
| | `POST` | `/api/chatbot/ticket` | None | Draft ticket from chatbot flow |
| | `POST` | `/api/chatbot/llm` | None | Proxy message to local LLM backend |
| **Users** | `GET` | `/api/users` | JWT (Admin) | Fetch registered user roster |
| | `DELETE` | `/api/users/:id` | JWT (Admin) | Terminate user account |
| **DB View** | `GET` | `/api/db-view/tables` | JWT (Admin) | Fetch table counts (PostgreSQL only) |
| | `GET` | `/api/db-view/:table` | JWT (Admin) | Search/sort table rows (PostgreSQL only) |

---

## 🖥️ Frontend Navigation Map

| Client URL | Protected | Page Component | Features & Purpose |
| :--- | :--- | :--- | :--- |
| `/` | No | [Home.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/Home.jsx) | Fluid glassmorphic welcome landing. |
| `/login` | Redirect if auth | [Auth.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/Auth.jsx) | Seamless registration & login panel. |
| `/forgot-password`| No | [ForgotPassword.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/ForgotPassword.jsx) | Generates passkey email request links. |
| `/reset-password/:token`| No | [ResetPassword.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/ResetPassword.jsx) | Resets credential parameters using link. |
| `/faq` | No | [FAQ.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/FAQ.jsx) | Accordion list of official FAQ categories. |
| `/ask` | Yes (User) | [AskQuery.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/AskQuery.jsx) | Form to open new query tickets. |
| `/board` | Yes (User) | [QueryBoard.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/QueryBoard.jsx) | Overview of owned queries and responses. |
| `/status` | Yes (User) | [StatusTracker.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/StatusTracker.jsx) | Interactive claim & resolution timeline. |
| `/forum` | Yes (User) | [Forum.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/Forum.jsx) | Discussions feed list. |
| `/forum/:id` | Yes (User) | [ForumPost.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/ForumPost.jsx) | Detailed QA post, reply lists & scoring. |
| `/admin` | Yes (Admin) | [AdminReview.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/AdminReview.jsx) | Queue workspace for query claiming/resolving. |
| `/escalation` | Yes (Admin) | [Escalation.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/Escalation.jsx) | Admin escalated tickets queue. |
| `/users` | Yes (Admin) | [Users.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/Users.jsx) | Management sheet for administrator roster. |
| `/db` | Yes (Admin) | [AdminDB.jsx](file:///c:/code/vins/Faq---System/frontend/src/pages/AdminDB.jsx) | Server-paginated SQL tabular inspector. |

---

## 🔑 Seeding the Initial Admin Account

You can register as an admin using the Auth registration screen by choosing the administrative signup checkbox (if enabled), or inject it manually into your storage layer.

**PostgreSQL / MongoDB / JSON manual insertion:**
```json
{
  "name": "Super Admin",
  "email": "admin@example.com",
  "password": "$2a$10$U4sW3N34.qR1k.91U517.uN3O3S1X3Y2c/P4C5Z4D5g1H1v1e1r1y", // bcrypt hash of "admin123"
  "role": "admin"
}
```

---

## 🤖 LLM Chatbot Integration

To connect the Chatbot to a local LLM or API:
1.  Run your local server (e.g. LM-Studio, Ollama, vLLM) on port `6006` or adjust the URI in [chatbot.js](file:///c:/code/vins/Faq---System/backend/routes/chatbot.js#L15).
2.  Set `LLM_API_KEY` in your `.env` file.
3.  The chatbot will automatically fallback to querying the LLM endpoint whenever standard FAQ score matching yields no high-confidence solutions.

---

## ⚖️ High Availability & Load Balancing Guide

To scale the backend Node.js server to handle high concurrent traffic and ensure continuous service availability, two load-balancing architecture patterns are recommended.

```
                  ┌──────────────────────────────┐
                  │      Client HTTPS Traffic    │
                  └──────────────┬───────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │    Nginx Reverse Proxy &     │
                  │   Load Balancer (Port 80)    │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Node Server #1  │     │ Node Server #2  │     │ Node Server #3  │
│ (Port 5001)     │     │ (Port 5002)     │     │ (Port 5003)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │ PostgreSQL / MongoDB DB  │
                    └──────────────────────────┘
```

### Pattern A: Process-Level Load Balancing (Single VM/Server)
Use **PM2 Cluster Mode** to automatically spawn instance processes matching the system's available CPU cores. PM2 shares the target port internally and distributes requests using round-robin logic:

1.  Install PM2 globally:
    ```bash
    npm install pm2 -g
    ```
2.  Define process parameters in `ecosystem.config.js`:
    ```javascript
    module.exports = {
      apps: [{
        name: 'faq-backend',
        script: './server.js',
        instances: 'max', // Spawns one instance per CPU core
        exec_mode: 'cluster', // Enables round-robin balancing
        env: {
          NODE_ENV: 'production',
          PORT: 5000
        }
      }]
    };
    ```
3.  Execute and monitor processes:
    ```bash
    pm2 start ecosystem.config.js
    pm2 status
    ```

### Pattern B: Service-Level Load Balancing (Multi-Server/VM)
Use **Nginx** upstream configuration to balance traffic across multiple machines or container instances:

1.  Establish running instances of the Node server on target addresses (e.g. `10.0.0.10:5000`, `10.0.0.11:5000`, `10.0.0.12:5000`).
2.  Configure Nginx reverse-proxy settings inside `/etc/nginx/nginx.conf`:
    ```nginx
    upstream faq_backend_servers {
        # Least-connections strategy distributes to least busy instances
        least_conn; 
        
        server 10.0.0.10:5000 max_fails=3 fail_timeout=10s;
        server 10.0.0.11:5000 max_fails=3 fail_timeout=10s;
        server 10.0.0.12:5000 max_fails=3 fail_timeout=10s;
    }

    server {
        listen 80;
        server_name faq-system.local;

        location /api/ {
            proxy_pass http://faq_backend_servers;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```
3.  Reload Nginx configuration:
    ```bash
    sudo nginx -s reload
    ```
