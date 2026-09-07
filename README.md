# 🐄 RwaCow — Rwanda Cow Tracking System

A full-stack web application for registering, tracking, and managing cattle across Rwanda. It covers the complete lifecycle of a cow: registration, ownership, location, vaccination, offspring (*izakomotse*), sale/transfer, and slaughter (*izabazwe*).

Available in **English** and **Kinyarwanda**, with role-based access for farmers, veterinarians, government officials, slaughterhouses, and administrators.

---

## 📋 Table of Contents

1. [What the System Does](#-what-the-system-does)
2. [Who Uses It (Roles)](#-who-uses-it-roles)
3. [Technology Stack](#-technology-stack)
4. [System Requirements](#-system-requirements)
5. [Installation & Setup](#-installation--setup)
6. [Running the System](#-running-the-system)
7. [User Guide](#-user-guide)
8. [Data Privacy & Security](#-data-privacy--security)
9. [Backup & Export](#-backup--export)
10. [Troubleshooting](#-troubleshooting)
11. [Project Structure](#-project-structure)
12. [API Reference](#-api-reference)

---

## 🎯 What the System Does

| Feature | Description |
|---|---|
| 🐄 **Cow Registration** | Record each cow with a unique tag number, breed, gender, birth date, color, and weight |
| 👤 **Owner Management** | Track owners by national ID, phone, and location |
| 📍 **Location Tracking** | Locate each cow by Province → District → Sector → Cell → Village (+ optional GPS) |
| 💉 **Vaccination Records** | Record vaccines given, the date, and the next due date |
| 🐣 **Offspring (Izakomotse)** | Register calves born from a cow, linked to their mother |
| 🔪 **Slaughter (Izabazwe)** | Schedule and confirm slaughter, record meat weight |
| 🔄 **Ownership Transfer** | Re-register a cow to a new owner when sold, with full history |
| 🌍 **Bilingual** | Full English + Kinyarwanda interface |
| 🔐 **Role-Based Access** | Each role sees and does only what it should |
| 📥 **Excel Export & Backup** | Download data as Excel; admins can back up the whole database |

---

## 👥 Who Uses It (Roles)

| Role | Kinyarwanda | What they can do |
|---|---|---|
| **Admin** | Umuyobozi Mukuru | Full access to everything + full database backup |
| **Government** | Umukozi wa Leta | View all data, manage owners, export reports |
| **Veterinarian** | Muganga w'Amatungo | Record vaccinations, update cow health info |
| **Farmer** | Umworozi | Manage only their own cows, register offspring, transfer ownership |
| **Slaughterhouse** | Ubwicanyi bw'Amatungo | Schedule and confirm slaughter of cattle |

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Database** | MySQL (MariaDB via XAMPP) — with SQLite fallback |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt password hashing |
| **Excel Export** | SheetJS (xlsx) |

---

## 💻 System Requirements

- **Node.js** 18 or newer ([download](https://nodejs.org))
- **XAMPP** (for MySQL/MariaDB) ([download](https://www.apachefriends.org))
- A modern web browser (Chrome, Edge, Firefox)
- Windows, macOS, or Linux

---

## ⚙️ Installation & Setup

### Step 1 — Start MySQL

1. Open the **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. Wait until it turns green (running on port 3306)

### Step 2 — Configure the backend

The backend reads settings from `backend/.env`. The defaults match XAMPP:

```
DB_ENGINE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cow_tracking
DB_USER=root
DB_PASSWORD=
```

> If your MySQL has a root password, put it in `DB_PASSWORD`.

### Step 3 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 4 — Create the database & sample data

```bash
cd backend
npm run mysql:migrate    # creates the database and all tables
npm run mysql:seed       # adds test accounts and a sample cow
```

After seeding, these test accounts exist:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rwacow.rw` | `admin123` |
| Vet | `vet@rwacow.rw` | `vet123` |
| Farmer | `farmer@rwacow.rw` | `farmer123` |

---

## ▶️ Running the System

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```
You should see: `MySQL pool ready → localhost:3306/cow_tracking` and `Server running on port 5000`.

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
You should see a local URL like `http://localhost:3000` (or `3001` if 3000 is busy).

Open that URL in your browser. 🎉

> **Keep both terminals and XAMPP MySQL running** while using the app. If the backend or MySQL stops, the app switches to a read-only "Demo Mode" with sample data.

---

## 📖 User Guide

### 1. Welcome Page
The landing page explains the system and its features. Use the **EN / RW** toggle to switch language. Click **Get Started** to register or **Sign In** to log in.

### 2. Creating an Account
- Click **Create Account**
- Fill in full name, email, phone, and choose a role (Farmer, Vet, Government, or Slaughterhouse)
- Set a password (at least 8 characters)
- Click **Create My Account**

> Admin accounts cannot be self-registered — they are created by an existing administrator.

### 3. Signing In
- Enter your email and password
- Forgot your password? Click **Forgot password?**, enter your email, and follow the reset link
  *(in development, the reset link is printed in the backend terminal)*

### 4. Dashboard
Shows live statistics:
- Total active cows, vaccinated, slaughtered, and sold
- Cows by district (bar chart)
- Upcoming vaccinations
- Scheduled slaughters

Click **Refresh** to reload the latest numbers.

### 5. Managing Cows
- **Cows** page lists all cows you're allowed to see
- Use **Search** and the **Status** filter to find cows
- Click **Register Cow** to add a new one
  *(farmers: the cow is automatically registered under your account)*
- Click **View Details** on any cow to open its full profile

### 6. Cow Detail Page (Tabs)
- **Info** — breed, gender, color, weight, birth date, notes
- **Vaccinations** — history + next due date. *Vets/Admin/Government can add records; farmers view only.*
- **Offspring (Izakomotse)** — calves born from this cow
- **Transfers** — ownership history. *Admin/Government/Farmer can transfer.*
- **Slaughter** — slaughter record if any

### 7. Recording a Vaccination *(Vet / Government / Admin)*
1. Open the cow → **Vaccinations** tab
2. Fill in vaccine name, date given, next due date, and batch number
3. Click **Save**

### 8. Registering Offspring
1. Go to **Offspring** → **Register Offspring**
2. Select the mother cow, enter the calf's tag, birth date, weight, and gender
3. Click **Save** — the calf is automatically registered as a new cow

### 9. Transferring Ownership (Selling a Cow)
1. Open the cow → **Transfers** tab
2. Select the new owner, enter the sale price and date
3. Click **Save** — the cow is now registered to the new owner

### 10. Slaughter Records *(Slaughterhouse / Government / Admin)*
1. Go to **Slaughter** → **Schedule Slaughter**, pick a cow and date
2. When done, click **Confirm Slaughter** and enter the meat weight

### 11. Language Switching
Use the **Kinyarwanda / English** button in the top bar at any time.

---

## 🔐 Data Privacy & Security

- **Passwords** are hashed with bcrypt — never stored in plain text
- **JWT tokens** protect every API request; expired/invalid tokens are rejected
- **Role-based access** is enforced on the server, not just hidden in the UI:

| Data | Admin | Government | Vet | Farmer | Slaughterhouse |
|---|---|---|---|---|---|
| Cows | All | All | All | **Own only** | Scheduled only |
| Owners + National ID | Full | Full | No NID | Own only | ❌ |
| Vaccinations | ✅ | ✅ | ✅ | Own cows | ❌ |
| Offspring | ✅ | ✅ | ✅ | Own cows | ❌ |
| Slaughter | ✅ | ✅ | ❌ | ❌ | ✅ |
| Transfers + Prices | Full | Full | No prices | Own cows | ❌ |
| Database Backup | ✅ | ❌ | ❌ | ❌ | ❌ |

A farmer can **never** see or modify another farmer's cows — this is enforced at the database-query level.

---

## 📥 Backup & Export

Go to the **Export & Backup** page (visible to Admin, Government, Vet, Farmer).

- **Individual sheets** — download any table (cows, vaccinations, etc.) as an Excel `.xlsx` file
- **Full workbook** — all your permitted sheets in one Excel file
- **JSON backup** *(Admin only)* — a complete snapshot of the entire database

Each export is scoped to your role, so you only ever download data you're allowed to see.

### Manual database backup (Admin/IT)
You can also back up MySQL directly:
```bash
C:\xampp\mysql\bin\mysqldump.exe -u root cow_tracking > backup.sql
```
Restore with:
```bash
C:\xampp\mysql\bin\mysql.exe -u root cow_tracking < backup.sql
```

---

## 🔧 Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Yellow "Demo Mode" banner | Backend is offline | Start backend (`npm run dev`) and make sure MySQL is running |
| "Registration failed" | Backend or MySQL not running | Start XAMPP MySQL, then the backend |
| MySQL won't start in XAMPP | Corrupted Aria log | Rename `aria_log.*` files in `C:\xampp\mysql\data`, then restart MySQL |
| "Invalid credentials" on login | Wrong email/password | Use a seeded account or reset the password |
| Port 3000 in use | Another app is using it | Vite auto-switches to 3001 — check the terminal for the URL |
| Port 5000 in use | Old backend still running | Find the PID with `netstat -ano \| findstr :5000` and `taskkill /PID <pid> /F` |

---

## 📁 Project Structure

```
Cow-management/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── controllers/        # Business logic (cows, owners, auth, etc.)
│   │   ├── routes/             # API endpoint definitions
│   │   ├── middleware/         # Auth & role checks
│   │   ├── database/           # DB adapter, migrations, seed
│   │   └── index.js            # Server entry point
│   └── .env                    # Configuration
│
├── frontend/                   # React web app
│   └── src/
│       ├── pages/              # Each screen (Dashboard, Cows, Export, etc.)
│       ├── components/         # Shared UI (Layout)
│       ├── context/            # Auth state
│       ├── i18n/               # English + Kinyarwanda translations
│       └── services/           # API client
│
└── README.md                   # This file
```

---

## 🔌 API Reference

Base URL: `http://localhost:5000/api`
All protected routes require an `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in, returns a token |
| GET | `/auth/me` | Current user info |
| POST | `/auth/forgot-password` | Request a reset link |
| POST | `/auth/reset-password` | Set a new password |

### Cows
| Method | Endpoint | Description |
|---|---|---|
| GET | `/cows` | List cows (filters: `status`, `search`, `district`) |
| GET | `/cows/stats` | Dashboard statistics |
| GET | `/cows/:id` | Full cow profile |
| POST | `/cows` | Register a cow |
| PUT | `/cows/:id` | Update a cow |

### Owners
| Method | Endpoint | Description |
|---|---|---|
| GET | `/owners` | List owners |
| GET | `/owners/:id` | Owner detail + their cows |
| POST | `/owners` | Register an owner |
| PUT | `/owners/:id` | Update an owner |

### Vaccinations, Offspring, Slaughter, Transfers
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/vaccinations` | List / add vaccination |
| GET/POST | `/offspring` | List / register offspring |
| GET/POST | `/slaughter` | List / schedule slaughter |
| PUT | `/slaughter/:id/confirm` | Confirm slaughter |
| GET/POST | `/transfers` | List / transfer ownership |

### Export
| Method | Endpoint | Description |
|---|---|---|
| GET | `/export/csv/:sheet` | Export a table as CSV |
| GET | `/export/backup` | Full JSON backup (admin only) |

---

## 📞 Support

For issues or questions about the system, contact your system administrator.

**RwaCow** — Empowering Rwandan Livestock Management 🇷🇼
