# Rehab360

Full-stack rehabilitation support platform: resident dashboards, guardian workflows, doctor tools, community chat (Socket.IO), scheduled reports, and optional Python ML services.

**Repository:** [github.com/Abhinay25670/Rehab360-Project](https://github.com/Abhinay25670/Rehab360-Project)

## Repository layout

| Path | Description |
|------|-------------|
| [frontend/](frontend/) | React 19 + Vite + Tailwind, Clerk auth |
| [backend/](backend/) | Express, MongoDB (Mongoose), Socket.IO, cron jobs |
| [ml/](ml/) | Optional FastAPI/Python services (emotion chatbot, assessments, etc.) |

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, Clerk, Axios, Socket.IO client, i18next  
- **Backend:** Node.js, Express, MongoDB, JWT (legacy routes), Resend email, optional Twilio SMS  
- **Realtime:** Socket.IO (community chat, private messages)  
- **Auth (primary):** Clerk (`VITE_CLERK_PUBLISHABLE_KEY`)

## Prerequisites

- Node.js 18+
- MongoDB ([Atlas](https://www.mongodb.com/cloud/atlas) free tier works)
- Clerk account ([clerk.com](https://clerk.com))
- (Optional) Resend for email, Twilio for SMS, Python 3.10+ for `ml/`

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
```

Edit `backend/.env` and `frontend/.env.local` with real values (see tables below).

### 3. Run

```bash
# Terminal A — API + WebSockets (default http://localhost:5000)
cd backend
npm run dev
# or: npm start

# Terminal B — Vite (http://localhost:5173)
cd frontend
npm run dev
```

Optional ML stack (port 8000): see `ml/.env.example` and run your combined FastAPI entrypoint if you use AI features.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for legacy JWT routes (min ~32 chars) |
| `PORT` | No | Defaults to `5000` |
| `FRONTEND_URL` | Production | Your deployed frontend URL(s), comma-separated; CORS always allows `http://localhost:5173` |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Verified sender |
| `TWILIO_*` | No | SMS (see `backend/.env.example`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `VITE_API_URL` | Yes | Backend base URL, e.g. `http://localhost:5000` |
| `VITE_SOCKET_URL` | No | Socket.IO URL; defaults to `VITE_API_URL` |
| `VITE_ML_API_URL` | No | Python ML base URL; defaults to `http://localhost:8000` |

## Free-tier deployment (recommended split)

Use a **static host** for the SPA and a **Node host** for the API. Example: **Vercel** + **Render** + **MongoDB Atlas** + **Clerk** (all have free tiers; limits and cold starts apply).

1. **MongoDB Atlas**  
   Create a cluster → Network Access: allow `0.0.0.0/0` (typical for PaaS) → copy `MONGO_URI`.

2. **Clerk**  
   Create an application → add your local and production frontend URLs to allowed origins → copy the publishable key into `VITE_CLERK_PUBLISHABLE_KEY`.

3. **Backend (e.g. Render)**  
   New **Web Service** → connect this repo → **Root directory:** `backend` → Build: `npm install` → Start: `npm start` → set env: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` (your Vercel URL, e.g. `https://xxx.vercel.app`), Resend/Twilio as needed. Render sets `PORT` automatically.

4. **Frontend (e.g. Vercel)**  
   New project → **Root directory:** `frontend` → Framework: Vite → Build: `npm run build` → Output: `dist` → Environment:  
   `VITE_API_URL=https://<your-render-service>.onrender.com`  
   `VITE_CLERK_PUBLISHABLE_KEY=<your key>`  

5. **CORS**  
   Set `FRONTEND_URL` on the backend to the exact Vercel URL (comma-separate multiple). Redeploy backend after changing it.

6. **WebSockets**  
   The client uses `VITE_API_URL` / `VITE_SOCKET_URL` for Socket.IO; pointing at the same host as the API is usually sufficient on Render.

**Note:** Free dynos may spin down when idle (cold start). Optional `ml/` services need a separate Python deployment or run locally.

## License

MIT
