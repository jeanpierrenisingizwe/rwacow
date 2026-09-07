# 🌐 RwaCow — Deployment Guide (Free Hosting)

Deploy the system for free using **Railway** (backend + MySQL) and **Vercel** (frontend).

**Result:** a public URL you can open from any device to test the system online.

---

## Overview

| Part | Host | Cost |
|------|------|------|
| Frontend (React) | **Vercel** | Free |
| Backend (Node/Express) | **Railway** | Free trial credit |
| Database (MySQL) | **Railway** | Free trial credit |

---

## Prerequisites

1. A **GitHub account** ([github.com](https://github.com))
2. A **Railway account** ([railway.app](https://railway.app)) — sign up with GitHub
3. A **Vercel account** ([vercel.com](https://vercel.com)) — sign up with GitHub
4. **Git** installed on your computer ([git-scm.com](https://git-scm.com))

---

## Step 1 — Push Your Code to GitHub

From the project root (`E:\Cow-management`):

```bash
git init
git add .
git commit -m "Initial commit - RwaCow system"
```

Then create a new **empty** repository on GitHub (e.g. `rwacow`), and:

```bash
git remote add origin https://github.com/YOUR_USERNAME/rwacow.git
git branch -M main
git push -u origin main
```

> The `.gitignore` already excludes `node_modules`, `.env`, and the local database — good.

---

## Step 2 — Deploy the Database + Backend on Railway

### 2a. Create the MySQL database
1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Provision MySQL** (or "Add a Database" → MySQL)
3. Railway creates a MySQL instance and gives you connection details

### 2b. Deploy the backend
1. In the same project, click **New** → **GitHub Repo** → select your `rwacow` repo
2. Railway detects Node.js. Set the **Root Directory** to `backend`
3. Go to the backend service → **Variables** tab and add:

```
DB_ENGINE = mysql
MYSQL_URL = ${{MySQL.MYSQL_URL}}
JWT_SECRET = <a-long-random-secret-string>
JWT_EXPIRES_IN = 7d
NODE_ENV = production
FRONTEND_URL = https://your-frontend.vercel.app
```

> `MYSQL_URL` references the MySQL service Railway created. Use Railway's
> variable reference feature, or copy the connection URL directly.

4. Under **Settings → Deploy**, set the **Start Command** to:
   ```
   node src/index.js
   ```

### 2c. Create the tables + seed data (run once)
In the backend service, open the **Railway shell** (or use a one-off command) and run:

```bash
npm run deploy:setup
```

This creates all tables and adds the test accounts.

### 2d. Get your backend URL
Railway gives the backend a public URL like:
```
https://rwacow-backend-production.up.railway.app
```
Your API base is that URL **+ `/api`**.

---

## Step 3 — Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your `rwacow` GitHub repo
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects Vite. Confirm:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add an **Environment Variable**:

```
VITE_API_URL = https://your-backend.up.railway.app/api
```
   *(use your actual Railway backend URL from Step 2d)*

6. Click **Deploy**

Vercel gives you a public URL like:
```
https://rwacow.vercel.app
```

---

## Step 4 — Connect Frontend ↔ Backend

1. Copy your **Vercel frontend URL**
2. Go back to Railway → backend → **Variables**
3. Set `FRONTEND_URL` to your Vercel URL (e.g. `https://rwacow.vercel.app`)
4. Railway redeploys automatically

This lets the backend accept requests from your hosted frontend (CORS).

---

## Step 5 — Test It

1. Open your Vercel URL in any browser (even on your phone)
2. Log in with a seeded account:
   - `admin@rwacow.rw` / `admin123`
3. If the first request is slow, that's the free-tier backend waking up — it's normal.

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Value |
|---|---|
| `DB_ENGINE` | `mysql` |
| `MYSQL_URL` | (Railway MySQL connection URL) |
| `JWT_SECRET` | a long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | your Vercel URL |

### Frontend (Vercel)
| Variable | Value |
|---|---|
| `VITE_API_URL` | your Railway backend URL + `/api` |

---

## Alternative: Render (instead of Railway)

If you prefer **Render** for the backend:
1. [render.com](https://render.com) → **New → Web Service** → connect GitHub
2. Root directory: `backend`, Build: `npm install`, Start: `node src/index.js`
3. Add the same environment variables
4. For MySQL, use **Railway MySQL**, **Aiven**, or **Clever Cloud** and put the URL in `MYSQL_URL`

> Note: Render's free tier sleeps after 15 minutes of inactivity and takes
> ~30 seconds to wake on the first request.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend shows "Demo Mode" | Backend URL wrong or backend asleep. Check `VITE_API_URL` and wait for wake-up |
| CORS error in browser console | `FRONTEND_URL` on the backend doesn't match your Vercel URL |
| Login fails online | Run `npm run deploy:setup` on Railway to seed accounts |
| Database connection error | Check `MYSQL_URL` is set correctly on the backend |
| Build fails on Vercel | Ensure Root Directory is `frontend` |

---

## Updating the Deployed App

Whenever you push changes to GitHub:
```bash
git add .
git commit -m "your change"
git push
```
Both Railway and Vercel **auto-redeploy** from the `main` branch. No manual steps needed.

---

**RwaCow** — Now live on the web 🌍🐄
