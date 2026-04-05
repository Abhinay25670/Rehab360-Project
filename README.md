# CSD-2025-26-BATCH-A-03 — Rehab360 (Rehabilitation Management)

**Course / batch repository** for the Rehab360 platform — a full-stack application for addiction recovery support.

**Related upstream (deployment-ready reference):** [github.com/Abhinay25670/Rehab360-Project](https://github.com/Abhinay25670/Rehab360-Project)

**Live site:** [rehablabs.in](https://rehablabs.in)

---

## About the project

**Rehab360** helps people in recovery stay connected to care: residents track mood, sleep, cravings, and nutrition; **guardians** receive alerts and weekly summaries when risk rises or when the resident uses **SOS**; **doctors** can coordinate meetings and view patient context; **community chat** (Socket.IO) supports peer connection alongside optional **AI-assisted** tools from the Python `ml/` services.

The system is built as three parts that can be developed and deployed independently:

- **`frontend/`** — Single-page app (React + Vite): sign-in (Clerk), dashboards, chat client.
- **`backend/`** — REST API + WebSockets (Express + MongoDB): data, guardian routes, email (Resend), optional SMS (Twilio), scheduled jobs.
- **`ml/`** — Optional FastAPI/Python services (e.g. emotion-aware chatbot, assessments, forecasting) when you need cloud AI beyond local fallbacks.

This batch repo mirrors that architecture so coursework, demos, and reports can describe **what the product does for users** and **how it is hosted**, without needing a page-by-page tour of the UI.

---

## What the product offers (high level)

- Secure sign-in and role-aware access (Clerk)
- Real-time community and private messaging (Socket.IO)
- Resident tools: recovery metrics, nutrition, meetings, SOS, internationalization (i18n)
- Guardian onboarding, high-risk and SOS notifications, scheduled reports
- Doctor-facing scheduling and patient lists
- Optional ML: chatbot, sleep/craving analysis, risk signals — deploy `ml/` separately in production

---

## Repository layout

| Path | Role |
|------|------|
| [`frontend/`](frontend/) | React 19, Vite, Tailwind, Clerk, i18next |
| [`backend/`](backend/) | Express, MongoDB (Mongoose), Socket.IO, cron |
| [`ml/`](ml/) | Optional Python / FastAPI services |

---

## Tech stack (summary)

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Clerk, Axios, Socket.IO client, i18next |
| Backend | Node.js, Express, MongoDB, JWT (legacy routes), Resend, optional Twilio |
| Realtime | Socket.IO (typically same host as API in production) |
| Auth | Clerk (`VITE_CLERK_PUBLISHABLE_KEY`) |
| ML (optional) | Python, FastAPI, OpenRouter / service-specific configs — see `ml/.env.example` |

---

## User roles (conceptual)

| Role | Purpose |
|------|---------|
| Resident / patient | Recovery tracking, chat, metrics, SOS |
| Guardian | Contact for alerts and reports |
| Doctor | Patient coordination, meetings |
| Worker / admin / super admin | Operations and moderation (as implemented in app routes) |

---

## Prerequisites

- **Node.js** 18+
- **MongoDB** ([Atlas](https://www.mongodb.com/cloud/atlas) free tier works)
- **Clerk** ([clerk.com](https://clerk.com))
- Optional: **Resend** (email), **Twilio** (SMS), **Python 3.10+** for `ml/`

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/MeghanaMahendrakar/CSD-2025-26-Batch-A-03.git
cd CSD-2025-26-Batch-A-03

cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Optional ML:
# cp ml/.env.example ml/.env
```

Edit `backend/.env` and `frontend/.env.local` using the tables below.

### 3. Run

**Terminal A — API + WebSockets**

```bash
cd backend
npm run dev
```

Default: `http://localhost:5000` (or `PORT` in `.env`).

**Terminal B — Vite**

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

**Optional — ML**

Configure `ml/.env` (see `ml/.env.example`). Example for a combined FastAPI app:

```bash
cd ml
pip install -r requirements.txt
uvicorn main_combined_api:main_app --host 0.0.0.0 --port 8000
```

Set `VITE_ML_API_URL` in the frontend to your deployed ML base URL in production.

---

## Environment variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for legacy JWT routes (≥ ~32 characters) |
| `PORT` | No | Default `5000`; PaaS usually sets `PORT` |
| `FRONTEND_URL` | Production | Comma-separated frontend origins for CORS; `http://localhost:5173` is always allowed |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Verified sender |
| `TWILIO_*` | No | SMS — see `backend/.env.example` |

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `VITE_API_URL` | Yes | Backend base URL, e.g. `http://localhost:5000` |
| `VITE_SOCKET_URL` | No | Socket.IO URL; defaults to `VITE_API_URL` |
| `VITE_ML_API_URL` | No | ML base URL; defaults to `http://localhost:8000` |

### ML — `ml/.env` (optional)

See `ml/.env.example` for `OPENROUTER_*`, `CRAVING_API_URL`, and ports.

---

## Deployment (step-by-step)

Free-tier hosting usually splits **static frontend**, **Node API**, **MongoDB Atlas**, and **Clerk**. Below is a concrete path (e.g. **Vercel** + **Render**); other hosts work if you mirror the same env rules.

### Architecture

```
Users → HTTPS → [Vercel: React SPA]
                    ↓ API calls / WebSockets
              [Render: Express + Socket.IO] → MongoDB Atlas
                    ↑
Clerk (auth) validates tokens on the client; backend trusts configured CORS origins.
Optional: second Render service or Railway for Python `ml/`.
```

### 1. MongoDB Atlas

1. Create a project and cluster (M0 is fine).
2. Database Access: create a user with read/write on your app DB.
3. Network Access: allow `0.0.0.0/0` for PaaS egress IPs (or restrict later).
4. Copy **connection string** → `MONGO_URI` on the backend.

### 2. Clerk

1. Create an application.
2. **Allowed origins / redirect URLs:** add `http://localhost:5173`, your Vercel preview URLs, and production `https://yourdomain.com` (and `www` if used).
3. Copy **Publishable key** → `VITE_CLERK_PUBLISHABLE_KEY` on the frontend.

### 3. Backend on Render (example)

1. New **Web Service** → connect this GitHub repo.
2. **Root directory:** `backend`
3. **Build:** `npm install`
4. **Start:** `npm start`
5. **Environment:** at minimum `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` (your real frontend URL(s), comma-separated). Add Resend/Twilio if you use alerts.
6. Deploy and note the URL, e.g. `https://your-api.onrender.com`.

**CORS:** `FRONTEND_URL` must match the **exact** browser origins (scheme + host + port if any). After any change, redeploy the backend.

### 4. Frontend on Vercel (example)

1. New project → same repo, **root directory:** `frontend`
2. Framework: **Vite**; build `npm run build`; output `dist`
3. **Environment variables:**
   - `VITE_API_URL` = your Render API URL (or `https://api.yourdomain.com` after custom domain)
   - `VITE_CLERK_PUBLISHABLE_KEY` = from Clerk
4. Redeploy whenever env vars change.

### 5. WebSockets

Point `VITE_API_URL` (and `VITE_SOCKET_URL` if set) at the **same host** as the API. On Render, ensure the service supports long-lived connections (same web service as HTTP).

### 6. Optional ML service

1. Separate **Python** web service, root `ml`, `pip install -r requirements.txt`
2. Start e.g. `uvicorn main_combined_api:main_app --host 0.0.0.0 --port $PORT`
3. Frontend: `VITE_ML_API_URL=https://your-ml-service.onrender.com`
4. In `ml/.env`, point internal URLs (e.g. `CRAVING_API_URL`) to real services — **not** `localhost` in production.

### 7. Custom domain (e.g. `rehablabs.in`)

Typical split:

| DNS name | Points to | Role |
|----------|-----------|------|
| Apex / `www` | Vercel (A/CNAME as they instruct) | React app |
| `api` | Render (CNAME to their hostname) | API + Socket.IO |

Then: `VITE_API_URL=https://api.rehablabs.in`, `FRONTEND_URL=https://rehablabs.in,https://www.rehablabs.in`, and add those URLs in Clerk.

### 8. Checklist before calling it “production”

- [ ] Atlas user + network rules allow the backend to connect
- [ ] `FRONTEND_URL` lists every live frontend origin
- [ ] Clerk origins include production HTTPS URLs
- [ ] `VITE_API_URL` is the public API URL (HTTPS)
- [ ] Email/SMS env vars set if you rely on guardian alerts
- [ ] ML URL set if you deploy Python services

Cold starts and free-tier quotas apply on hosted providers.

---

## Scripts reference

| Location | Command | Purpose |
|----------|---------|---------|
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production build → `dist/` |
| `backend/` | `npm run dev` | Nodemon |
| `backend/` | `npm start` | Production (`node server.js`) |

---

## Troubleshooting

- **CORS errors** — `FRONTEND_URL` must match the exact origin users use.
- **Chat / sockets fail** — API host must match `VITE_SOCKET_URL` / `VITE_API_URL`.
- **Clerk loops** — Add all dev and prod URLs to Clerk’s allowed origins and redirects.
- **ML features** — Deploy `ml/` and set `VITE_ML_API_URL`; check `CRAVING_API_URL` inside ML env for production paths.

---

## Contributing

1. Fork or branch from this repo
2. Keep commits focused; match existing code style
3. Open a pull request with a short description of behavior changes

---

## License

MIT
