# 🚀 RwaCow — Quick Start Guide

A one-page guide to get the system running fast (for demos and presentations).

---

## Before You Start

Make sure these are installed:
- ✅ Node.js 18+
- ✅ XAMPP (with MySQL)

---

## Start in 4 Steps

### 1️⃣ Start MySQL
Open **XAMPP Control Panel** → click **Start** next to **MySQL** (wait for green).

### 2️⃣ Start the Backend
```bash
cd backend
npm run dev
```
✅ Wait for: `Server running on port 5000`

### 3️⃣ Start the Frontend
```bash
cd frontend
npm run dev
```
✅ Note the URL shown (usually `http://localhost:3000` or `3001`)

### 4️⃣ Open in Browser
Go to the URL from step 3.

---

## Login Accounts

| Role | Email | Password |
|---|---|---|
| 👑 Admin | `admin@rwacow.rw` | `admin123` |
| 🩺 Vet | `vet@rwacow.rw` | `vet123` |
| 🌾 Farmer | `farmer@rwacow.rw` | `farmer123` |

---

## First-Time Setup (only once)

If the database is empty, run these once:
```bash
cd backend
npm run mysql:migrate    # create tables
npm run mysql:seed       # add test accounts
```

---

## If You See a Yellow "Demo Mode" Banner

That means the backend or MySQL is not running. Fix:
1. Start MySQL in XAMPP
2. Start the backend (`npm run dev`)
3. Refresh the browser

---

## Stopping Everything

- Press `Ctrl + C` in each terminal
- Stop MySQL in XAMPP Control Panel
