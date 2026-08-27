# TripManager (TripSplit) ✈️💸

A modern, full-stack trip management, expense splitting, and group travel planning application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **MongoDB**.

TripManager simplifies group travel by managing expenses, optimizing debt settlements using a greedy minimal-transfer algorithm, providing per-trip virtual wallets, organizing day-by-day itineraries, hosting group polls, logging trip activity, and enabling live member location sharing.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Database Setup (Prisma & MongoDB)](#-database-setup-prisma--mongodb)
- [Available Scripts](#-available-scripts)
- [Project Architecture & Code Structure](#-project-architecture--code-structure)
- [Database Schema & Models](#-database-schema--models)
- [Core Business Logic & Algorithms](#-core-business-logic--algorithms)
- [API Routes Overview](#-api-routes-overview)
- [Authentication & Security](#-authentication--security)
- [Handover Checklist for New Developers](#-handover-checklist-for-new-developers)

---

## ✨ Features

- **🔐 Authentication & User Profiles**: Custom JWT authentication with HTTP-only cookies, password hashing (`bcryptjs`), OTP verifications via SMS & Email, profile management, and document uploads (Aadhaar, Passport, DL, PAN).
- **🗺️ Trip Management**: Create and join trips using unique trip codes, configure budget limits, set multi-currency preferences, lock/unlock trips, and toggle admin approval mode for expenses.
- **💰 Expense Tracking & Approval Workflow**:
  - Add expenses split among specific trip members.
  - Track categories (Food, Travel, Stay, Miscellaneous, etc.) and receipt images/urls.
  - Expense approval system with pending/approved/rejected states and edit/delete requests.
- **🧮 Smart Debt Settlement Engine & Advance Credit**:
  - Automatically calculates net balances for all trip members.
  - Uses a greedy minimal cash-transfer algorithm (`computeSettlements`) to minimize the total number of transactions needed to settle debts.
  - Supports partial settlements, advance credit tracking, and rollback requests.
  - Unused excess payments automatically create **Advance Credit** to absorb future expense shares.
- **📅 Itinerary & Stay Planner**:
  - Day-by-day itinerary schedule with categories, locations, and time slots.
  - Accommodation details manager with check-in/out times and booking references.
- **🗳️ Group Polls**: Create polls for destinations, departure times, or food spots with real-time voting.
- **📍 Real-Time Location Sharing**: Opt-in live location coordinate sharing among trip members.
- **📜 Trip Activity Audit Log**: Comprehensive, chronological timeline logging all actions within a trip.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & API Routes)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**: [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons), [Framer Motion](https://www.framer.com/motion/) (Animations)
- **Database**: [MongoDB](https://www.mongodb.com/) (NoSQL cluster/database)
- **ORM**: [Prisma ORM 5.x](https://www.prisma.io/)
- **Authentication**: Custom JWT using [`jose`](https://github.com/panva/jose) & [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js)
- **Utilities**: `clsx`, `tailwind-merge`

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or `v20.x` (LTS recommended)
- **npm**: `v9.x` or later
- **MongoDB Database**: Access to a MongoDB Atlas cluster or a local MongoDB instance supporting replica sets (required by Prisma for MongoDB transactions).

---

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd TripManager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables)).

4. **Generate Prisma Client & Push Database Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Create a `.env` file in the root of the project with the following keys:

```env
# MongoDB Connection String (MongoDB Atlas or Local Replica Set)
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/tripsplit?retryWrites=true&w=majority"

# JWT Secret Key for Session Signing
JWT_SECRET="your-super-secret-jwt-key"

# Base URL of the Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🗄️ Database Setup (Prisma & MongoDB)

The project uses **Prisma ORM** with **MongoDB** as the provider (`prisma/schema.prisma`).

### Useful Prisma Commands

- **Generate Prisma Client**:
  ```bash
  npx prisma generate
  ```
  *Run this after changing `prisma/schema.prisma` or pulling fresh code.*

- **Push Schema Changes to MongoDB**:
  ```bash
  npx prisma db push
  ```
  *Applies schema changes directly to the MongoDB database without SQL migration files.*

- **Open Prisma Studio**:
  ```bash
  npx prisma studio
  ```
  *Opens a local web interface at `http://localhost:5555` to view and edit database collections.*

---

## 📜 Available Scripts

In the `package.json`, the following scripts are available:

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Generates the Prisma client and builds the application for production (`prisma generate && next build`).
- `npm run start`: Starts the Next.js production server.
- `npm run lint`: Runs Next.js ESLint check.
- `npm run prisma:generate`: Generates Prisma Client artifacts.
- `npm run prisma:db-push`: Pushes schema definitions directly to MongoDB.

---

## 📂 Project Architecture & Code Structure

```
TripManager/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/                 # Unauthenticated Routes (Grouped)
│   │   ├── login/page.tsx      # Login Page
│   │   └── register/page.tsx   # Registration Page
│   ├── api/                    # API Routes (Server-side endpoints)
│   │   ├── auth/               # Login, Register, Logout, Me API
│   │   ├── edit-requests/      # Expense Edit/Delete approval requests API
│   │   ├── expenses/           # Expense CRUD & Approval API
│   │   ├── trips/              # Trips CRUD, Join, Activity, Analytics, Polls, Wallets, etc.
│   │   └── user/               # User Profile, Documents, Emergency Contacts API
│   ├── dashboard/              # Authenticated User Dashboard
│   │   ├── page.tsx            # Trips Overview & Creation
│   │   ├── profile/page.tsx    # User Profile & Verification Documents
│   │   └── trip/[tripId]/      # Individual Trip Management Dashboard
│   ├── globals.css             # Tailwind CSS & Global Styling
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Landing / Redirect Page
├── components/                 # React UI Components
│   ├── expense/                # Expense Form & Expense List Modal/Cards
│   ├── member/                 # Member List & Invitation Modal
│   ├── profile/                # Profile Edit Forms & Document Uploaders
│   ├── settlement/             # Settlement Modals, Calculations & Record List
│   ├── trip/                   # Trip Creation, Itinerary, Polls, Stays & Activity Cards
│   ├── ui/                     # Reusable UI Elements (Button, Input, Card, Modal, Badges)
│   └── wallet/                 # Advance Credit Modal Component
├── lib/                        # Core Helpers & Business Logic
│   ├── auth.ts                 # JWT signing, verification, password hashing & cookie storage
│   ├── clientSession.ts        # Client-side session management helpers
│   ├── dbStore.ts              # In-memory / database storage wrapper functions
│   ├── email.ts                # Email OTP utility functions
│   ├── prisma.ts               # Prisma Client singleton instance
│   ├── settlement.ts           # Member balance calculation & greedy settlement algorithm
│   ├── sms.ts                  # SMS OTP utility & phone number sanitization
│   └── utils.ts                # General utility functions (clsx, formatters, etc.)
├── prisma/
│   └── schema.prisma           # Prisma Schema (MongoDB models & relationships)
├── types/
│   └── index.ts                # TypeScript interfaces and data models
├── .env                        # Local Environment Variables
├── next.config.js              # Next.js Configuration
├── tailwind.config.js          # Tailwind CSS Configuration
├── tsconfig.json               # TypeScript Configuration
└── package.json                # Project Dependencies & Scripts
```

---

## 📊 Database Schema & Models

The database schema is defined in [`prisma/schema.prisma`](file:///Users/parikshitgole/TripManager/prisma/schema.prisma) using MongoDB ObjectIDs (`@db.ObjectId`).

### Model Overview (15 Collections)

1. **`User`**: System users storing name, email, hashed password, mobile, DOB, currency preferences, emergency contacts, and relations to trips, expenses, and settlements.
2. **`Trip`**: Trips created by users with trip code (`code`), currency, budget, start/end dates, locked state (`isLocked`), and admin approval mode toggle (`approvalMode`).
3. **`TripMember`**: Junction collection mapping users to trips with roles (`ADMIN` or `MEMBER`). `@unique([tripId, userId])`.
4. **`Expense`**: Expense records containing `title`, `amount`, `category`, `paidById`, `status` (`APPROVED`, `PENDING_APPROVAL`, `REJECTED`), `receiptUrl`, and timestamps.
5. **`ExpenseParticipant`**: Stores each member's owed share (`shareAmount`) for a specific expense. `@unique([expenseId, userId])`.
6. **`Activity`**: Audit trail logging trip actions (`TRIP_CREATED`, `EXPENSE_ADDED`, `EXPENSE_APPROVED`, `SETTLEMENT_MARKED`, etc.).
7. **`Settlement`**: Recorded payment settlements between two users (`fromUserId` -> `toUserId`), with statuses (`PENDING`, `SETTLED`, `CONFIRMED`, `ROLLBACK_REQUESTED`, `ROLLED_BACK`).
8. **`ExpenseEditRequest`**: Proposals to edit or delete existing expenses when trip approval mode is enabled.
9. **`UserDocument`**: Identity documents uploaded by users (Aadhaar, Passport, Driving License, PAN).
10. **`ItineraryItem`**: Schedule items for a trip by `dayNumber`, start/end times, category, and order.
11. **`StayDetail`**: Accommodation details (hotel name, address, check-in/out dates/times, booking references).
12. **`Poll`**: Group voting polls with questions and categories.
13. **`PollOption`**: Options listed under a poll.
14. **`PollVote`**: Votes cast by trip members on poll options. `@unique([pollId, userId])`.
15. **`MemberLocation`**: Real-time GPS coordinates shared by trip members. `@unique([tripId, userId])`.
16. **`OtpVerification`**: Stores hashed OTP codes for SMS and email verification flows with attempt limits and expiration.

---

## 🧮 Core Business Logic & Algorithms

### 1. Settlement Math Engine ([`lib/settlement.ts`](file:///Users/parikshitgole/TripManager/lib/settlement.ts))

- **`calculateMemberBalances(members, expenses, settlements)`**:
  - Iterates through all `APPROVED` expenses.
  - Credits the payer's total paid amount and debits participant shares.
  - Incorporates all valid `CONFIRMED` or `COMPLETED` settlements.
  - Returns a list of net balances (`paid - share`) for each member.

- **`computeSettlements(members, expenses, settlements)`**:
  - Separates members into **Debtors** (net balance < 0) and **Creditors** (net balance > 0).
  - Sorts both lists in descending order of amount.
  - Applies a **greedy matching algorithm** to generate the minimal possible set of cash transactions required to bring everyone's balance back to zero.

### 2. Expense Approval Mode

- When a trip's `approvalMode` is `true`, any newly added expense defaults to status `PENDING_APPROVAL`.
- Trip admins can approve or reject expenses via `/api/expenses/[expenseId]/approve`.
- Non-admins must submit an `ExpenseEditRequest` to modify or delete existing approved expenses.

### 3. Per-Trip Virtual Wallets

- Members can request a wallet advance (`WalletAdvance`).
- Admins approve the advance, which creates an `ADVANCE_CREDIT` transaction in `WalletTransaction` and increases the user's `UserWallet.balance`.
- When an expense is paid using `paymentMode: "WALLET"`, the user's wallet is debited (`EXPENSE_DEBIT`).

---

## 🌐 API Routes Overview

- **Auth**:
  - `POST /api/auth/register` - Create account & generate JWT cookie.
  - `POST /api/auth/login` - Authenticate & set JWT cookie.
  - `POST /api/auth/logout` - Clear JWT cookie.
  - `GET /api/auth/me` - Fetch authenticated user session.
- **Trips**:
  - `GET / POST /api/trips` - List or create trips.
  - `POST /api/trips/join` - Join trip via unique trip code.
  - `GET / PUT / DELETE /api/trips/[tripId]` - Fetch, update, or delete trip.
  - `GET / POST /api/trips/[tripId]/expenses` - List or create expenses.
  - `GET / POST /api/trips/[tripId]/members` - Manage trip members and roles.
  - `GET / POST /api/trips/[tripId]/settlement` - Compute or record settlements.
  - `GET / POST /api/trips/[tripId]/wallet` - Virtual wallet transactions & advances.
  - `GET / POST /api/trips/[tripId]/itinerary` - Itinerary management.
  - `GET / POST /api/trips/[tripId]/stay` - Accommodation tracking.
  - `GET / POST /api/trips/[tripId]/polls` - Poll creation & voting.
  - `GET / POST /api/trips/[tripId]/location` - Real-time location updates.
  - `GET /api/trips/[tripId]/activity` - Trip audit activity log.

---

## 🛡️ Authentication & Security

- Session management uses **HttpOnly, SameSite=Lax** cookies (`tripsplit_auth_token`) signed with **HS256 JWT** via `jose`.
- Password verification relies on `bcryptjs` with salt rounds set to 10.
- Phone and recovery email OTPs are securely hashed on the server prior to storage in `OtpVerification`.

---

## 🤝 Handover Checklist for New Developers

- [ ] Clone the repo and install dependencies (`npm install`).
- [ ] Setup your `.env` with a valid `DATABASE_URL` (MongoDB Atlas or local replica set) and a secret `JWT_SECRET`.
- [ ] Run `npx prisma generate` followed by `npx prisma db push` to synchronize your database collections.
- [ ] Run `npm run dev` and navigate to `http://localhost:3000`.
- [ ] Create a test user, create a trip, copy the trip code, and test joining with a second user account (in an incognito window) to test expense splitting and greedy settlement calculations.
