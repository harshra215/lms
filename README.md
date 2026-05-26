# Loan Management System (LMS)

A full-stack lending platform built with MERN + Next.js + TypeScript.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt

---

## Project Structure

```
LMS/
├── backend/          # Express API
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, RBAC, upload
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   ├── scripts/      # Seed script
│   │   ├── utils/        # BRE, JWT helpers
│   │   └── index.ts
│   └── uploads/      # Salary slip files
└── frontend/         # Next.js app
    └── src/
        ├── app/          # App Router pages
        │   ├── auth/     # Login / Register
        │   ├── apply/    # Borrower flow
        │   └── dashboard/ # Executive modules
        ├── components/   # Reusable UI
        └── lib/          # API client, auth, BRE
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm run seed      # Creates one account per role
npm run dev       # Starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev       # Starts on http://localhost:3000
```

---

## Login Credentials (after running seed)

| Role         | Email                    | Password       |
|--------------|--------------------------|----------------|
| Admin        | admin@lms.com            | Admin@123      |
| Sales        | sales@lms.com            | Sales@123      |
| Sanction     | sanction@lms.com         | Sanction@123   |
| Disbursement | disbursement@lms.com     | Disburse@123   |
| Collection   | collection@lms.com       | Collect@123    |
| Borrower     | borrower@lms.com         | Borrower@123   |

---

## Features

### Borrower Portal
- Sign up / Login with hashed passwords
- 3-step application: Personal Details → Salary Slip → Loan Config
- Server-side Business Rule Engine (BRE):
  - Age must be 23–50
  - Monthly salary ≥ ₹25,000
  - Valid PAN format (AAAAA9999A)
  - Not unemployed
- File upload: PDF/JPG/PNG, max 5 MB
- Loan sliders: ₹50K–₹5L amount, 30–365 day tenure
- Live interest calculation: SI = (P × R × T) / (365 × 100) at 12% p.a.
- Real-time loan status tracking with repayment progress

### Operations Dashboard
| Module       | Role         | Actions                              |
|--------------|--------------|--------------------------------------|
| Sales        | sales        | View all borrower leads              |
| Sanction     | sanction     | Approve / Reject applied loans       |
| Disbursement | disbursement | Mark sanctioned loans as disbursed   |
| Collection   | collection   | Record payments, auto-close on full repayment |
| Overview     | admin        | Stats across all modules             |

### RBAC
- JWT-based authentication
- Role enforced on both frontend (route guards) and backend (middleware)
- API returns 403 for unauthorized access
- Admin sees all modules; each executive sees only their own

---

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

PUT    /api/users/profile          (borrower)
GET    /api/users/leads            (sales, admin)

POST   /api/loans/upload-salary-slip  (borrower)
POST   /api/loans/apply               (borrower)
GET    /api/loans/my                  (borrower)
GET    /api/loans/applied             (sanction, admin)
PATCH  /api/loans/:id/sanction        (sanction, admin)
PATCH  /api/loans/:id/reject          (sanction, admin)
GET    /api/loans/sanctioned          (disbursement, admin)
PATCH  /api/loans/:id/disburse        (disbursement, admin)
GET    /api/loans/disbursed           (collection, admin)
GET    /api/loans                     (admin)

POST   /api/payments                  (collection, admin)
GET    /api/payments/loan/:loanId     (collection, admin)

GET    /api/dashboard/stats           (admin)
```

---

## Loan Status Flow

```
APPLIED → SANCTIONED → DISBURSED → CLOSED
       ↘ REJECTED
```
