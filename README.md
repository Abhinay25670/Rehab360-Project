# Rehab360

Full-stack platform for addiction recovery support: **resident dashboards**, **guardian workflows**, **doctor scheduling**, **community chat** (Socket.IO), **email/SMS alerts**, scheduled reports, and optional **Python ML** services (chatbot, assessments).

---

## Features

- Clerk-powered sign-in and protected routes  
- Real-time community and private messaging via Socket.IO  
- Resident tools: mood tracking, nutrition, meetings, SOS, i18n  
- Guardian onboarding, alerts, and reporting hooks  
- Doctor dashboard: patients, meetings, availability  
- Optional ML stack (FastAPI) for AI-assisted flows when deployed separately  

---

## Repository layout

| Path | Role |
|------|------|
| [`frontend/`](frontend/) | React 19, Vite, Tailwind, Clerk, i18next |
| [`backend/`](backend/) | Express, MongoDB (Mongoose), Socket.IO, cron |
| [`ml/`](ml/) | Optional Python / FastAPI services |

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Clerk, Axios, Socket.IO client, i18next |
| Backend | Node.js, Express, MongoDB, JWT (legacy routes), Resend, optional Twilio |
| Realtime | Socket.IO (same origin as API in typical deploys) |
| Auth | Clerk (`VITE_CLERK_PUBLISHABLE_KEY`) |

---

## Prerequisites

- **Node.js** 18+
- **MongoDB** ([Atlas](https://www.mongodb.com/cloud/atlas) free tier is fine)
- **Clerk** app ([clerk.com](https://clerk.com))
- Optional: **Resend** (email), **Twilio** (SMS), **Python 3.10+** for `ml/`

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/Abhinay25670/Rehab360-Project.git
cd Rehab360-Project

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

**Terminal B — Vite dev server**

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

**Optional — ML services**

Configure `ml/.env` (see [`ml/.env.example`](ml/.env.example)). Point `CRAVING_API_URL` at your craving API if it runs on another port. For a combined FastAPI app, typical local command:

```bash
cd ml
pip install -r requirements.txt
# Example (adjust module name to your entrypoint):
uvicorn main_combined_api:main_app --host 0.0.0.0 --port 8000
```

Set `VITE_ML_API_URL` in the frontend to match your deployed ML base URL in production.

---

## Environment variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for legacy JWT routes (≥ ~32 characters) |
| `PORT` | No | Default `5000`; PaaS usually injects `PORT` |
| `FRONTEND_URL` | Production | Comma-separated frontend origins for CORS; local `http://localhost:5173` is always allowed |
| `RESEND_API_KEY` | For email | [Resend](https://resend.com) API key |
| `RESEND_FROM_EMAIL` | For email | Verified sender address |
| `TWILIO_*` | No | SMS — see comments in [`backend/.env.example`](backend/.env.example) |

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `VITE_API_URL` | Yes | Backend base URL, e.g. `http://localhost:5000` |
| `VITE_SOCKET_URL` | No | Socket.IO URL; defaults to `VITE_API_URL` |
| `VITE_ML_API_URL` | No | ML API base URL; defaults to `http://localhost:8000` |

### ML — `ml/.env` (optional)

See [`ml/.env.example`](ml/.env.example) for `OPENROUTER_*`, `CRAVING_API_URL`, and `ML_API_PORT`.

---

## Deployment (free-tier friendly)

Split hosting works well: **static frontend** + **Node backend** + **Atlas** + **Clerk**.

1. **MongoDB Atlas** — Create a cluster; allow your PaaS IPs or `0.0.0.0/0` for simplicity; copy `MONGO_URI`.

2. **Clerk** — Create an application; add **Allowed origins** for local and production URLs; copy the publishable key into `VITE_CLERK_PUBLISHABLE_KEY`.

3. **Backend (e.g. Render)** — Web service, root directory `backend`, install `npm install`, start `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` (your real frontend URL), plus email/SMS if used.

4. **Frontend (e.g. Vercel)** — Root `frontend`, build `npm run build`, output `dist`. Set `VITE_API_URL` to your API URL and `VITE_CLERK_PUBLISHABLE_KEY`. Redeploy after env changes.

5. **CORS** — `FRONTEND_URL` must list every origin users hit (comma-separated). Redeploy the backend after changes.

6. **WebSockets** — Usually works when `VITE_API_URL` / `VITE_SOCKET_URL` point at the same host as the API.

7. **ML on Render (optional)** — Python web service, root `ml`, `pip install -r requirements.txt`, start command e.g. `uvicorn main_combined_api:main_app --host 0.0.0.0 --port $PORT`. Set frontend `VITE_ML_API_URL` to that service’s public URL (not `localhost`).

Cold starts and free-tier limits apply on hosted providers.

---

## Custom domain (e.g. Hostinger DNS + Vercel + Render)

You can keep the domain at **Hostinger** and point DNS to **Vercel** (site) and **Render** (API). No paid “Node hosting” at the registrar is required for this architecture.

| Hostname | Typical record | Purpose |
|----------|----------------|---------|
| Apex (`example.com`) | A / ALIAS per your static host | SPA |
| `www` | CNAME per static host | SPA |
| `api` | CNAME to your Render hostname | API + Socket.IO |

1. Deploy backend; add custom domain `api.yourdomain.com` in the host’s UI; create the CNAME they show in DNS.  
2. Deploy frontend; add apex + `www` in Vercel (or similar); add the A/CNAME records they show.  
3. Set `VITE_API_URL=https://api.yourdomain.com` and redeploy frontend.  
4. Set `FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com` and redeploy backend.  
5. In **Clerk**, add the same HTTPS origins under allowed domains / origins.

If the apex record is problematic, use **`www` as canonical** and redirect apex → `www` in your static host.

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

- **CORS errors** — Ensure `FRONTEND_URL` matches the exact browser origin (scheme + host + port if any).  
- **Chat / sockets fail** — Confirm `VITE_SOCKET_URL` (or `VITE_API_URL`) matches the API host and that the backend Socket.IO server is reachable.  
- **Clerk redirect issues** — Add every environment URL (local + prod) to Clerk’s allowed origins and redirect URLs.  
- **ML features offline** — Deploy `ml/` separately and set `VITE_ML_API_URL`; ensure `CRAVING_API_URL` inside ML points to the correct internal craving service path (e.g. `/enhanced_craving_api`), not localhost in production.

