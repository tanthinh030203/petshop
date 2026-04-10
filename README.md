# PetShop - Veterinary Clinic & Pet Shop Management System

Veterinary Clinic & Pet Shop Management System built with React + Express + TypeScript + Prisma + MySQL.

## Tech Stack

- **Frontend**: React 18, TypeScript, Ant Design 5, Zustand, React Router v6, Recharts, Vite
- **Backend**: Node.js 20, Express.js, TypeScript, Prisma ORM, Zod
- **Database**: MySQL 8.0, Redis 7
- **Auth**: JWT (access + refresh token), bcrypt, RBAC

## Prerequisites

- **Node.js** >= 18
- **MySQL** 8.0
- **Redis** 7
- **Docker** & Docker Compose (optional)

## Getting Started

### Option 1: Docker (recommended)

```bash
# Start MySQL & Redis containers
docker-compose up -d mysql redis
```

### Option 2: Local MySQL & Redis

Make sure MySQL and Redis are running locally on default ports (3306, 6379).

### Setup Database

```bash
# Create database (if not using Docker)
mysql -u root -p -e "CREATE DATABASE petshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Backend

```bash
cd server

# Install dependencies
npm install

# Copy env file and edit if needed
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed sample data
npm run seed

# Start dev server (http://localhost:3000)
npm run dev
```

### Frontend

```bash
cd client

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### Login

| Username | Password | Role        |
|----------|----------|-------------|
| admin    | 123456   | Super Admin |

Other seed accounts (all password `123456`):

| Username     | Role            |
|--------------|-----------------|
| manager_hcm  | Branch Manager  |
| dr_minh      | Veterinarian    |
| letan01      | Receptionist    |
| banhang01    | Sales Staff     |
| groomer01    | Groomer         |
| ketoan01     | Accountant      |

## Environment Variables

```env
DATABASE_URL="mysql://root:petshop123@localhost:3306/petshop"
JWT_SECRET=petshop-jwt-secret-key-2026
JWT_REFRESH_SECRET=petshop-refresh-secret-key-2026
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Project Structure

```
petshop/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/Layout/  # MainLayout, ProtectedRoute
│   │   ├── pages/              # 21 page components
│   │   ├── services/           # API service layer (Axios)
│   │   ├── stores/             # Zustand state management
│   │   ├── types/              # TypeScript interfaces
│   │   └── App.tsx             # Routes
│   └── package.json
│
├── server/                     # Backend (Express + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma       # 18 models, 13 enums
│   │   └── seed.ts             # Sample data
│   ├── src/
│   │   ├── config/             # Database, Redis
│   │   ├── controllers/        # 13 controllers
│   │   ├── middlewares/        # Auth, RBAC, Branch, Validate, Error
│   │   ├── routes/             # 13 route modules
│   │   ├── services/           # Business logic
│   │   ├── validators/         # Zod schemas
│   │   ├── utils/              # Logger, helpers
│   │   └── app.ts              # Express entry point
│   └── package.json
│
├── docker-compose.yml
└── spec.md
```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Module          | Endpoints                                       |
|-----------------|------------------------------------------------|
| Auth            | POST /auth/login, /auth/refresh, /auth/logout, GET /auth/me |
| Branches        | CRUD /branches                                  |
| Users           | CRUD /users, PATCH /users/:id/status            |
| Customers       | CRUD /customers, GET /customers/search          |
| Pets            | CRUD /pets, GET /pets/:id/medical-records, /vaccinations, /appointments |
| Products        | CRUD /products, /products/categories            |
| Services        | CRUD /services                                  |
| Appointments    | CRUD /appointments, PATCH /:id/status, GET /calendar |
| Medical Records | POST, GET, PUT /medical-records, POST /:id/prescriptions |
| Vaccinations    | POST, GET /vaccinations, GET /reminders         |
| Hotel           | GET/POST /hotel/bookings, PATCH check-in/check-out |
| Invoices        | CRUD /invoices, POST /:id/payments              |
| Stock           | GET /stock, POST /import, /export, /transfer, GET /movements |
| Reports         | GET /reports/revenue, /top-products, /top-services, /customers, /appointments, /stock-alerts |

## Production Build

```bash
# Backend
cd server && npm run build

# Frontend
cd client && npm run build
```
