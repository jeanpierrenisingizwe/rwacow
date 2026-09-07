# 🎤 RwaCow — Presentation Demo Script

A step-by-step walkthrough for demonstrating the system to stakeholders (e.g. your boss).
Estimated time: **8–10 minutes**.

---

## Before the Demo (5 min prep)

1. Start **XAMPP MySQL**
2. Start **backend** (`cd backend && npm run dev`)
3. Start **frontend** (`cd frontend && npm run dev`)
4. Open the browser to the frontend URL
5. Make sure you're **logged out** (start fresh on the Welcome page)
6. Have these accounts ready: admin / vet / farmer (see Quick Start)

---

## Demo Flow

### Part 1 — Introduction (1 min)
> "This is RwaCow, a system to track every cow in Rwanda — who owns it, where it is, its vaccinations, its calves, and whether it's been sold or slaughtered."

- Show the **Welcome page**
- Click the **EN / RW** toggle to show it works in **both English and Kinyarwanda**
- Scroll through the features section

### Part 2 — Sign In as Admin (1 min)
> "The system has different user roles. Let me start as an administrator, who sees everything."

- Click **Sign In**
- Login: `admin@rwacow.rw` / `admin123`
- Land on the **Dashboard**

### Part 3 — Dashboard (1 min)
> "The dashboard gives an instant overview."

- Point out: total active cows, vaccinated, slaughtered, sold
- Show **Cows by District** chart
- Show **Upcoming Vaccinations** list

### Part 4 — Cow Registry (2 min)
> "Here's the full cattle registry."

- Go to **Cows**
- Show the search and status filter
- Click **View Details** on a cow
- Walk through the tabs:
  - **Info** — the cow's identity
  - **Vaccinations** — with next due date
  - **Offspring** — its calves
  - **Transfers** — ownership history

### Part 5 — Record a Vaccination (1 min)
> "A veterinarian can record vaccinations and set the next due date."

- On the Vaccinations tab, fill the form and click **Save**
- Show it appears instantly in the history with the next due date

### Part 6 — Role-Based Privacy (2 min) ⭐ *Key selling point*
> "Data privacy is built in. A farmer only sees their own cows — never anyone else's."

- **Log out**, then log in as `farmer@rwacow.rw` / `farmer123`
- Show that the farmer sees **only their own cow**
- Show the sidebar has **fewer menu items** (no Owners page)
- Open the cow → Vaccinations tab → show it's **read-only** for farmers
  ("Vaccinations are recorded by a veterinarian")

### Part 7 — Excel Export & Backup (1 min)
> "All data can be exported to Excel, and admins can back up the whole database."

- Go to **Export & Backup**
- Click a sheet (e.g. **All Cows**) → an Excel file downloads
- (As admin) show the **JSON Backup** button

### Part 8 — Close (30 sec)
> "So in summary: RwaCow tracks the full life of every cow, works in Kinyarwanda and English, keeps each user's data private, runs on a real MySQL database, and exports to Excel for reporting."

---

## Talking Points / Value

- **Traceability** — every cow's history from birth to slaughter
- **Disease control** — vaccination tracking with due-date reminders
- **Ownership proof** — full transfer records prevent theft/disputes
- **Government oversight** — officials see national-level data
- **Local language** — accessible to Rwandan farmers in Kinyarwanda
- **Data security** — role-based access + encrypted passwords

---

## If Something Goes Wrong

- **Yellow "Demo Mode" banner?** → backend/MySQL is down. The app still works with sample data, so you can continue the demo. To fix: start MySQL + backend, then refresh.
- **Login fails?** → double-check the email/password from the table above.
