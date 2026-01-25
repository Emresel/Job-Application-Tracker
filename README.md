# Job Application Tracker (Web App)

This workspace contains:
- **Angular frontend** (`client/`)
- **Node.js/Express + SQLite backend** (`server/`)

The backend serves the built Angular app in production.

## Features
- **Authentication**: JWT-based register/login
- **Role-based access control**: Admin / Management / Regular / Guest (read-only preview)
- **Companies**: list, create (Admin/Management)
- **Categories**: CRUD (Admin/Management)
- **Applications**: full CRUD, server-side filtering/sorting/pagination
- **Application History**: status change log
- **Reminders**: user-scoped CRUD
- **Dashboard/Analytics**: summary metrics + daily time series
- **CSV export**
- **Audit log** for critical actions

## Project Structure
- `client/`: Angular frontend
- `server/`: backend + API hosting
  - `server/index.js`: API + static hosting
  - `server/schema.sql`: SQLite schema
  - `server/public/`: fallback page (shown if Angular client is not built)

## Install & Run
Prerequisite: Node.js 18+ recommended.

### Option A (recommended): production-like (Angular build served by Express)

```bash
cd client
npm.cmd install
npm.cmd run build

cd ..\server
npm.cmd install
npm.cmd run dev
```

### Option B: development (Angular dev server)

Terminal 1:

```bash
cd server
npm.cmd install
npm.cmd run dev
```

Terminal 2:

```bash
cd client
npm.cmd install
npm.cmd start
```

UI: `http://localhost:3000`

## Configuration
Optionally copy `server/.env.example` to `server/.env`.

## API Base URL
Default base: `http://localhost:3000/api/v1`

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Users
- `GET /api/v1/users/me`

### Companies
- `GET /api/v1/companies`
- `POST /api/v1/companies` (Admin/Management)

### Categories
- `GET /api/v1/categories`
- `POST /api/v1/categories` (Admin/Management)
- `PUT /api/v1/categories/:id` (Admin/Management)
- `DELETE /api/v1/categories/:id` (Admin/Management)

### Applications
- `GET /api/v1/applications?page=1&pageSize=20&status=Applied&sort=-appliedDate`
- `POST /api/v1/applications`
- `PUT /api/v1/applications/:id`
- `DELETE /api/v1/applications/:id`
- `GET /api/v1/applications/export.csv`

### Application History
- `GET /api/v1/applications/:id/history`
- `POST /api/v1/applications/:id/history`

### Reminders
- `GET /api/v1/reminders`
- `POST /api/v1/reminders`
- `DELETE /api/v1/reminders/:id`

### Dashboard
- `GET /api/v1/dashboard`
- `GET /api/v1/dashboard/timeseries?from=2025-01-01&to=2025-01-31`
- `GET /api/v1/dashboard/status-breakdown`

## Guest / Read-only Preview (No Login)
If there is no token, `GET /api/v1/dashboard` returns sample data. Other endpoints require authentication.

