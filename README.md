# 🛡️ BugHunt Pro — Enterprise Defensive Vulnerability Management Platform

> **Crafted & Developed with Precision by Stella**

BugHunt Pro is a professional, role-based bug tracking and defensive vulnerability management platform built with Node.js, Express, SQLite, and React with Vanilla CSS.

---

## 🌟 Key Features

- **Persona-Based RBAC**:
  - **Reporter**: File bug reports, verify fixes, close reports.
  - **Developer**: View assigned reports, update lifecycle status, collaborate via comments.
  - **Security Researcher**: Report vulnerability research and track triage.
  - **Admin**: Full oversight, developer assignment, and immutable audit logs.
- **Strict Resolution Lifecycle**:
  Enforced state machine: `OPEN` → `ASSIGNED` → `IN PROGRESS` → `FIXED` → `UNDER VERIFICATION` → `VERIFIED` → `CLOSED` (or `REOPENED`).
- **Real-Time In-App Notifications**:
  Database-backed notification bell with unread counter, mark as read, and direct navigation to referenced bugs.
- **Dynamic Real-Time Dashboards**:
  Computed directly from SQLite database queries (no hardcoded metrics).
- **Strict Password Policy**:
  8–16 characters with a required combination of letters and numbers.
- **Security Hardening**:
  - `helmet` security headers.
  - `express-rate-limit` brute-force protection.
  - IDOR protection on all resources.
  - Passwords hashed with `bcryptjs` (salt rounds: 10).
  - Signed JWT tokens.
- **Modern Dark Glassmorphic Design System**:
  Custom Vanilla CSS tokens without heavy utility frameworks.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/yajali-manideepak/bounty.git
cd bounty

# Install root & backend dependencies
npm install

# Install client dependencies
npm install --prefix client
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=./server/data/bughunt.db
AUTH_SECRET=your_secret_jwt_key_here
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Database Setup & Seeding
```bash
# Run schema migrations and load demo users & seed bugs
npm run db:seed
```

### 5. Run the Application

#### Development Mode (Concurrent API on port 5000 + Vite on port 5173)
```bash
npm run dev
```

#### Production Server (Express serving API & built client)
```bash
npm run build --prefix client
node server/src/server.js
```
Open **http://localhost:5000** in your browser.

---

## 🧪 Testing

Run the automated test suite verifying all 19 workflow, RBAC, and IDOR assertions:
```bash
npm test
```

---

## 👥 Demo Accounts (Seeded)

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@bughunt.local` | `AdminPass123!` |
| **Developer (Alex)** | `dev1@bughunt.local` | `DevPass123!` |
| **Developer (Sarah)** | `dev2@bughunt.local` | `DevPass123!` |
| **Reporter (Riley)** | `reporter1@bughunt.local` | `ReporterPass123!` |
| **Researcher (Sam)** | `sec1@bughunt.local` | `SecPass123!` |

---

## 📜 License
ISC License © 2026 Stella / BugHunt Pro
