# LOBBI Project Management — Codebase Documentation

> Auto-generated documentation based on codebase analysis.
> Generated on: 2026-04-01

## Table of Contents

- [1. Overview](#1-overview)
- [2. Tech Stack & Dependencies](#2-tech-stack--dependencies)
- [3. Project Structure](#3-project-structure)
- [4. Architecture](#4-architecture)
- [5. Getting Started](#5-getting-started)
- [6. Environment Variables](#6-environment-variables)
- [7. Database Schema & Models](#7-database-schema--models)
- [8. API Reference](#8-api-reference)
- [9. Features & Modules](#9-features--modules)
- [10. Authentication & Authorization](#10-authentication--authorization)
- [11. Core Business Logic Flows](#11-core-business-logic-flows)
- [12. Patterns & Conventions](#12-patterns--conventions)
- [13. Third-Party Integrations](#13-third-party-integrations)
- [14. Testing](#14-testing)
- [15. Deployment & CI/CD](#15-deployment--cicd)
- [16. Known Tech Debt & Observations](#16-known-tech-debt--observations)

---

## 1. Overview

LOBBI is a **Task and Team Management Dashboard** built as a full-stack Next.js application. It allows an admin to manage developers (team members) and assign, track, and organize project tasks. Developers can log in to a self-service portal to view their assigned tasks and create new ones.

The application supports two user roles:
- **Admin**: Full access to a dashboard with sidebar navigation, task management (CRUD, inline editing, bulk import from Excel/CSV), developer management (CRUD with avatar uploads), and stats overview.
- **Developer**: Access to a personal portal showing only their assigned tasks, with the ability to create new tasks and attach images.

Public (unauthenticated) visitors can view the main dashboard in read-only mode — seeing task stats and a filterable, sortable, paginated task table.

---

## 2. Tech Stack & Dependencies

### Core Framework
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | ^14.2.0 | Full-stack React framework (App Router) |
| **React** | ^18.3.0 | UI library |
| **TypeScript** | ^5.5.0 | Type-safe JavaScript |

### Database
| Dependency | Version | Purpose |
|---|---|---|
| **mongoose** | ^8.4.0 | MongoDB ODM for schema definition, queries, and connection pooling |

### Authentication
| Dependency | Version | Purpose |
|---|---|---|
| **jsonwebtoken** | ^9.0.3 | JWT token signing and verification |
| **bcryptjs** | ^3.0.3 | Password hashing and comparison |

### File Upload & Media
| Dependency | Version | Purpose |
|---|---|---|
| **cloudinary** | ^2.9.0 | Cloud image storage — upload/delete developer avatars and task attachments |

### Data Import
| Dependency | Version | Purpose |
|---|---|---|
| **xlsx** | ^0.18.5 | Parse Excel (.xlsx) and CSV files for bulk task import |

### UI & Styling
| Dependency | Version | Purpose |
|---|---|---|
| **tailwindcss** | ^3.4.0 | Utility-first CSS framework |
| **lucide-react** | ^0.400.0 | Icon library (SVG icons as React components) |
| **clsx** | ^2.1.0 | Conditional CSS class joining |
| **tailwind-merge** | ^2.3.0 | Merges Tailwind classes intelligently (used via `cn()` helper) |
| **sonner** | ^1.5.0 | Toast notification library |

### Data Fetching
| Dependency | Version | Purpose |
|---|---|---|
| **swr** | ^2.2.0 | React hooks for data fetching with caching, revalidation, and deduplication |

### Utilities
| Dependency | Version | Purpose |
|---|---|---|
| **date-fns** | ^3.6.0 | Date utility library (imported but `formatDate` is custom) |

### Dev Dependencies
| Dependency | Version | Purpose |
|---|---|---|
| **eslint** / **eslint-config-next** | ^8.57.0 / ^14.2.0 | Linting |
| **autoprefixer** | ^10.4.0 | PostCSS plugin for vendor prefixes |
| **postcss** | ^8.4.0 | CSS transformation pipeline |
| **@types/\*** | various | TypeScript type definitions for bcryptjs, jsonwebtoken, node, react, react-dom |

---

## 3. Project Structure

```
lobbi-ProjMngnt/
├── public/                          # Static assets (logo.png, etc.)
├── src/
│   ├── app/                         # Next.js App Router pages & API routes
│   │   ├── layout.tsx               # Root layout: Inter font, Toaster, metadata
│   │   ├── page.tsx                 # Homepage: public dashboard + admin dashboard view
│   │   ├── globals.css              # Tailwind setup + custom component classes
│   │   ├── login/
│   │   │   ├── layout.tsx           # Passthrough layout
│   │   │   └── page.tsx             # Login form (email/password)
│   │   ├── portal/
│   │   │   ├── layout.tsx           # Developer portal layout (auth-gated, header with user info)
│   │   │   └── page.tsx             # Developer portal: personal tasks, create task, attachments
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Admin layout (auth + admin gated, Sidebar + TopNav)
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx         # Admin task management: CRUD, inline editing, import, attachments
│   │   │   └── developers/
│   │   │       └── page.tsx         # Admin developer management: CRUD with avatar upload
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts   # POST: authenticate admin or developer
│   │       │   ├── logout/route.ts  # POST: clear auth cookie
│   │       │   └── me/route.ts      # GET: get current user from JWT cookie
│   │       ├── developers/
│   │       │   ├── route.ts         # GET (list/paginated), POST (create with avatar)
│   │       │   └── [id]/route.ts    # GET, PUT (update with avatar), DELETE
│   │       ├── tasks/
│   │       │   ├── route.ts         # GET (list/filtered/sorted/paginated), POST (create)
│   │       │   ├── [id]/route.ts    # GET, PATCH (partial update), DELETE
│   │       │   ├── stats/route.ts   # GET: aggregated task statistics
│   │       │   └── import/route.ts  # POST: bulk import from Excel/CSV
│   │       └── upload/
│   │           └── route.ts         # POST: upload file to Cloudinary
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx          # Responsive sidebar navigation (admin vs public items)
│   │       └── TopNav.tsx           # Top navigation bar with search and user profile
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth hook: login/logout/current user via SWR
│   │   ├── useDevelopers.ts        # Developer data hooks (all + paginated) via SWR
│   │   └── useTasks.ts             # Task data hooks (paginated + stats) via SWR
│   ├── lib/
│   │   ├── auth.ts                 # JWT sign/verify, getCurrentUser from cookie
│   │   ├── cloudinary.ts           # Cloudinary config, uploadToCloudinary, deleteFromCloudinary
│   │   ├── db.ts                   # MongoDB connection with caching (singleton pattern)
│   │   ├── utils.ts                # cn(), apiError(), getErrorMessage(), formatDate()
│   │   └── models/
│   │       ├── Developer.ts        # Mongoose schema: Developer (with password hashing)
│   │       └── Task.ts             # Mongoose schema: Task (with indexes)
│   └── types/
│       └── index.ts                # TypeScript interfaces: IDeveloper, ITask, IAttachment, TaskStats, etc.
├── next.config.js                   # Cloudinary image domain allowlist
├── tailwind.config.ts               # Custom colors (sidebar, brand), content paths
├── tsconfig.json                    # TypeScript config with @/* path alias
├── postcss.config.js                # PostCSS with Tailwind and Autoprefixer
└── package.json                     # Dependencies and scripts
```

---

## 4. Architecture

### Pattern

**Full-stack monolith** using the **Next.js App Router**. The frontend (React) and backend (API Routes) are co-located in a single Next.js project. There is no separate backend service.

### Layers

```
┌──────────────────────────────────────────────┐
│                 Frontend (React)              │
│  Pages / Layouts / Components / Hooks        │
├──────────────────────────────────────────────┤
│              SWR Data Layer                   │
│  Custom hooks wrapping SWR for data fetching │
├──────────────────────────────────────────────┤
│          Next.js API Routes (Backend)        │
│  Route handlers: auth, tasks, developers,    │
│  upload, import                              │
├──────────────────────────────────────────────┤
│            Library Layer                      │
│  db.ts, auth.ts, cloudinary.ts, utils.ts     │
├──────────────────────────────────────────────┤
│          Mongoose Models (ORM)               │
│  Developer.ts, Task.ts                       │
├──────────────────────────────────────────────┤
│              MongoDB (Database)               │
└──────────────────────────────────────────────┘
```

### Entry Point

The app bootstraps from `src/app/layout.tsx` (root layout), which sets the Inter font, renders child routes, and includes the `<Toaster />` from Sonner for toast notifications.

### Request Lifecycle (API)

1. Client-side SWR hook (e.g., `useTasks`) calls `fetch("/api/tasks?...")`
2. Next.js routes the request to `src/app/api/tasks/route.ts`
3. The route handler calls `connectDB()` from `src/lib/db.ts` to ensure a MongoDB connection
4. Mongoose models are used to query/mutate data (e.g., `Task.find(filter).populate("assignee")`)
5. JSON response is returned via `NextResponse.json()`

### Layer Communication

- **Frontend → Backend**: Direct `fetch()` calls to `/api/*` endpoints, wrapped in SWR hooks
- **Backend → Database**: Direct imports of Mongoose models (`Task`, `Developer`) and `connectDB()`
- **Backend → External Services**: Direct imports of `uploadToCloudinary()` / `deleteFromCloudinary()`

---

## 5. Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB instance (local or Atlas)
- Cloudinary account (for image uploads)

### Installation

```bash
npm install
```

### Running Locally

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

### Required Environment Variables

Create a `.env.local` file in the project root (see [Section 6](#6-environment-variables)).

---

## 6. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/lobbi`) |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `NODE_ENV` | Auto | Set to `"production"` in production — controls secure cookie flag |

No `.env.example` file was found in the codebase.

---

## 7. Database Schema & Models

### Developer (`src/lib/models/Developer.ts`)

Collection name: `developers`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | — | Developer's full name |
| `email` | String | Yes (unique) | — | Login credential, unique index |
| `password` | String | Yes | — | Hashed with bcrypt (salt rounds: 10) before save |
| `role` | String | Yes | — | e.g., "Frontend Developer", "Backend Developer" |
| `avatar` | String | No | `""` | Cloudinary URL of profile image |
| `phone` | String | No | `""` | Contact phone number |
| `status` | String (enum) | No | `"active"` | `"active"` or `"inactive"` |
| `createdAt` | Date | Auto | — | Mongoose timestamp |
| `updatedAt` | Date | Auto | — | Mongoose timestamp |

**Behaviors:**
- Pre-save hook hashes `password` using `bcrypt.hash(password, 10)` if modified
- Instance method `comparePassword(candidatePassword)` compares input against stored hash
- `toJSON` transform removes `password` field from serialized output

### Task (`src/lib/models/Task.ts`)

Collection name: `tasks`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | String | Yes | — | Task name |
| `description` | String | No | `""` | Task details |
| `status` | String (enum) | No | `"Pending"` | `"Pending"`, `"In Progress"`, `"Completed"` |
| `priority` | String (enum) | No | `"Medium"` | `"Low"`, `"Medium"`, `"High"` |
| `assignee` | ObjectId (ref: Developer) | No | `null` | Reference to a Developer document |
| `dueDate` | Date | No | `null` | Task deadline |
| `date` | Date | No | `Date.now` | Creation/assignment date |
| `attachments` | Array of subdocs | No | `[]` | Each: `{ filename: String, path: String, uploadedAt: Date }` |
| `createdAt` | Date | Auto | — | Mongoose timestamp |
| `updatedAt` | Date | Auto | — | Mongoose timestamp |

**Indexes:**
- Text index on `title` and `description` (for search)
- Compound index on `{ status: 1, priority: 1, assignee: 1 }`
- Descending index on `{ date: -1 }`
- Descending index on `{ createdAt: -1 }`

**Relationships:**
- `Task.assignee` → `Developer._id` (populated with `name, email, avatar, role` in queries)

---

## 8. API Reference

### Authentication

#### `POST /api/auth/login`
- **Auth required**: No
- **Request body**: `{ email: string, password: string }`
- **Logic**: Checks against hardcoded admin credentials first, then looks up a Developer by email and compares passwords using `comparePassword()`. Inactive developers are rejected with 403.
- **Response**: `{ user: { name, email, role, isAdmin, ... }, message: "Login successful" }`
- **Side effect**: Sets `token` httpOnly cookie (7-day expiry, secure in production)

#### `POST /api/auth/logout`
- **Auth required**: No (but only useful when authenticated)
- **Request body**: None
- **Response**: `{ message: "Logged out" }`
- **Side effect**: Clears `token` cookie by setting `maxAge: 0`

#### `GET /api/auth/me`
- **Auth required**: Yes (reads `token` cookie)
- **Response**: `{ user: { _id, name, email, role, isAdmin, ... } }` or `401` if not authenticated
- **Logic**: `getCurrentUser()` in `src/lib/auth.ts` extracts JWT from cookie, verifies it, then returns admin object or fetches Developer from DB

### Developers

#### `GET /api/developers`
- **Auth required**: No
- **Query params**: `page` (0 = no pagination, returns all), `limit` (default 12), `search`, `dateFrom`, `dateTo`
- **Response (paginated)**: `{ data: Developer[], total, page, totalPages }`
- **Response (page=0)**: `Developer[]` — flat array of all developers (used for dropdown selects)
- **Search**: Regex match on `name`, `email`, `role` (case-insensitive)

#### `POST /api/developers`
- **Auth required**: No (no middleware check in code)
- **Content-Type**: `multipart/form-data`
- **Fields**: `name`, `email`, `password` (min 4 chars), `role`, `phone` (optional), `avatar` (optional file)
- **Response**: Created developer object (201)
- **Side effect**: Uploads avatar to Cloudinary under `lobbi/developers` folder if provided

#### `GET /api/developers/[id]`
- **Auth required**: No
- **Response**: Single developer object (excludes password)

#### `PUT /api/developers/[id]`
- **Auth required**: No (no middleware check)
- **Content-Type**: `multipart/form-data`
- **Fields**: `name`, `email`, `role`, `phone`, `status`, `password` (optional, min 4 chars), `avatar` (optional file)
- **Response**: Updated developer object
- **Note**: Password is manually hashed with `bcrypt.hash(password, 10)` — bypasses the pre-save hook since it uses `findByIdAndUpdate`

#### `DELETE /api/developers/[id]`
- **Auth required**: No (no middleware check)
- **Response**: `{ message: "Developer deleted" }`

### Tasks

#### `GET /api/tasks`
- **Auth required**: No
- **Query params**: `page` (default 1), `limit` (default 10), `search`, `status`, `priority`, `assignee`, `sortBy` (default "createdAt"), `sortOrder` (default "desc"), `dateFrom`, `dateTo`
- **Response**: `{ data: Task[], total, page, totalPages }`
- **Search**: Regex match on `title` and `description` (case-insensitive)
- **Populated**: `assignee` field populated with `name, email, avatar, role`

#### `POST /api/tasks`
- **Auth required**: No (no middleware check)
- **Content-Type**: `application/json`
- **Request body**: `{ title, description?, status?, priority?, assignee?, dueDate?, date?, attachments? }`
- **Response**: Created task (populated) (201)

#### `GET /api/tasks/[id]`
- **Auth required**: No
- **Response**: Single task (populated)

#### `PATCH /api/tasks/[id]`
- **Auth required**: No
- **Content-Type**: `application/json`
- **Request body**: Partial task fields (any subset of task fields)
- **Response**: Updated task (populated)
- **Used for**: Inline editing of individual fields, attachment updates

#### `DELETE /api/tasks/[id]`
- **Auth required**: No
- **Response**: `{ message: "Task deleted" }`

#### `GET /api/tasks/stats`
- **Auth required**: No
- **Response**: `{ total, completed, pending, inProgress, overdue }`
- **Logic**: Uses MongoDB `$facet` aggregation to compute all stats in a single query. Overdue = tasks where `dueDate < now` and `status !== "Completed"`

#### `POST /api/tasks/import`
- **Auth required**: No (no middleware check)
- **Content-Type**: `multipart/form-data`
- **Fields**: `file` (Excel or CSV file)
- **Response**: `{ message, imported: number, errors?: string[] }`
- **Logic**: Parses file with `xlsx`, auto-detects columns by fuzzy name matching (`normalize()` + `findCol()`), resolves developer names to IDs (including partial match), maps status/priority values with aliases (e.g., "done" → "Completed"), handles Excel serial date numbers and DD-MM-YYYY formats, uses `Task.insertMany()` for batch insert

### Upload

#### `POST /api/upload`
- **Auth required**: No
- **Content-Type**: `multipart/form-data`
- **Fields**: `file` (any file, typically an image)
- **Response**: `{ path: string (Cloudinary URL), filename: string }`
- **Side effect**: Uploads to Cloudinary under `lobbi/attachments` folder

---

## 9. Features & Modules

### Feature 1: Public Dashboard (Homepage)

**Files**: `src/app/page.tsx`, `src/hooks/useTasks.ts`, `src/hooks/useDevelopers.ts`, `src/hooks/useAuth.ts`

The homepage (`/`) serves dual purpose:
- **Public visitors** see a simple header with the LOBBI logo and a read-only dashboard showing task stats cards (Total, Completed, In Progress, Pending) and a filterable, sortable, paginated task table.
- **Authenticated admins** see the same content wrapped in the admin layout (Sidebar + TopNav).

The page checks `useAuth()` to determine the view. Tasks are fetched via `useTasks(params)` with SWR. Filters include search, status, priority, assignee (dropdown populated by `useDevelopers()`), and date. Sorting is toggled by clicking column headers. Pagination is handled client-side by updating the `page` state which feeds into the API query params.

The task table shows: date, title (with description preview), developer (with avatar), status badge, priority badge, due date, and attachments (thumbnail preview + modal + lightbox).

### Feature 2: Admin Task Management

**Files**: `src/app/(dashboard)/tasks/page.tsx`, `src/app/(dashboard)/layout.tsx`

Accessible at `/tasks` — requires admin authentication. The dashboard layout (`(dashboard)/layout.tsx`) checks `useAuth()` and redirects non-admins to `/portal` and unauthenticated users to `/login`.

Features:
- **Inline editing**: Click any cell (title, description, status, priority, assignee, dates) to edit it in-place. Selects for status/priority/assignee use dropdowns. Changes are saved immediately via `PATCH /api/tasks/[id]`.
- **Add new task**: Toggle an inline "add row" at the top of the table with fields for all task properties plus file uploads.
- **Delete task**: Per-row delete button with confirmation dialog.
- **Attachment management**: Upload images to existing tasks, view in modal/lightbox, remove individual attachments.
- **Excel/CSV import**: Modal to upload a spreadsheet file that bulk-creates tasks via `/api/tasks/import`.
- **Search, filter, sort, paginate**: Same capabilities as the public dashboard.

### Feature 3: Admin Developer Management

**Files**: `src/app/(dashboard)/developers/page.tsx`, `src/hooks/useDevelopers.ts`

Accessible at `/developers` — requires admin authentication.

Features:
- **Developer cards**: Grid layout showing avatar, name, role, email, phone, status, and creation date.
- **Add developer**: Modal form with fields: name, email, password, role (dropdown with 7 preset roles), phone, avatar upload.
- **Edit developer**: Same modal pre-filled, password optional (leave blank to keep current), status toggle (active/inactive).
- **Delete developer**: Per-card delete with confirmation.
- **Search & filter**: Search by name/email/role, filter by date.
- **Pagination**: Client-driven with `useDevelopersPaginated()`.

Preset roles: Frontend Developer, Backend Developer, Full Stack Developer, UI/UX Designer, DevOps Engineer, Project Manager, QA Engineer.

### Feature 4: Developer Portal

**Files**: `src/app/portal/page.tsx`, `src/app/portal/layout.tsx`

Accessible at `/portal` — requires authentication (any user, not just admin). The layout redirects unauthenticated users to `/login` and shows a simple header with user info and logout.

Features:
- **Personal task view**: Tasks are filtered by `assignee = user._id` (unless admin). Shows stats cards scoped to the developer's tasks.
- **Create task**: Modal to create a new task (title, description, image attachments). Status defaults to "Pending", priority to "Medium". The task is automatically assigned to the current user. A note explains that status/priority/due date are admin-managed.
- **Task table**: Read-only view of assigned tasks with status/priority badges, due dates, and attachment viewing.
- **Search/filter**: Search, status tabs, date filter.

### Feature 5: Authentication

**Files**: `src/app/login/page.tsx`, `src/hooks/useAuth.ts`, `src/lib/auth.ts`, `src/app/api/auth/*`

Login page at `/login` with email/password form. Password visibility toggle. After login, admins redirect to `/`, developers redirect to `/portal`. Uses toast notifications for success/error feedback.

---

## 10. Authentication & Authorization

### Strategy

**JWT-based authentication** stored in an **httpOnly cookie**.

### Login Flow

```
User (Login Page) -> POST /api/auth/login { email, password }
                         |
                    ┌────┴────┐
                    │ Admin?  │ (hardcoded email/password check)
                    └────┬────┘
                    Yes/ \No
                   /      \
    signToken({     connectDB() -> Developer.findOne({ email })
      id: "admin",     -> developer.comparePassword(password)
      isAdmin: true     -> check developer.status !== "inactive"
    })                  -> signToken({ id: dev._id, isAdmin: false })
                   \      /
                    Set httpOnly cookie "token" (7d expiry)
                    Return user object
```

### Token Verification

`getCurrentUser()` in `src/lib/auth.ts`:
1. Reads `token` cookie from the request using `cookies()` (Next.js server-side)
2. Calls `verifyToken(token)` which uses `jwt.verify()` with `JWT_SECRET`
3. If `payload.isAdmin === true`, returns a hardcoded admin user object
4. Otherwise, fetches the Developer from MongoDB by `payload.id`

### Authorization Model

- **No middleware-based auth guards on API routes** — API endpoints do not check authentication. The auth checks exist only on the **frontend**:
  - `(dashboard)/layout.tsx`: Redirects non-admin users away from `/tasks` and `/developers`
  - `portal/layout.tsx`: Redirects unauthenticated users away from `/portal`
  - `page.tsx` (homepage): Conditionally renders admin layout vs public layout based on auth state

### Cookie Configuration

```typescript
{
  httpOnly: true,                              // Not accessible via JavaScript
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax",                             // CSRF protection
  maxAge: 60 * 60 * 24 * 7,                   // 7 days
  path: "/",                                   // Available on all routes
}
```

---

## 11. Core Business Logic Flows

### Task CRUD (Admin)

```
Admin -> TasksPage -> Inline Edit Cell
  -> PATCH /api/tasks/[id] { [field]: value }
  -> connectDB() -> Task.findByIdAndUpdate().populate("assignee")
  -> Return updated task -> SWR mutate() -> UI update
```

### Task Import from Excel/CSV

```
Admin -> Upload .xlsx/.csv -> POST /api/tasks/import (FormData)
  -> XLSX.read(buffer) -> sheet_to_json()
  -> Fuzzy column detection (normalize + findCol)
  -> For each row:
     -> Map status (e.g., "done" -> "Completed")
     -> Map priority (e.g., "high" -> "High")
     -> Resolve developer by name (exact or partial match against DB)
     -> Parse dates (Excel serial, DD-MM-YYYY, standard)
  -> Task.insertMany(tasksToCreate)
  -> Return { imported: count, errors: [...] }
```

### File Upload (Attachments)

```
User -> Select image files -> POST /api/upload (FormData per file)
  -> uploadToCloudinary(file, "lobbi/attachments")
  -> Cloudinary returns secure_url
  -> Return { path: url, filename }
  -> Client collects all uploaded attachment objects
  -> PATCH /api/tasks/[id] { attachments: [...existing, ...new] }
```

### Developer Portal Task Creation

```
Developer -> Create Task Modal -> Submit
  -> Upload attachments (if any) via POST /api/upload (sequentially)
  -> POST /api/tasks { title, description, assignee: user._id, status: "Pending", ... }
  -> SWR mutate() -> Refresh task list
```

### Authentication Flow

```
User -> Login Page -> POST /api/auth/login { email, password }
  -> Set JWT cookie
  -> useAuth() SWR -> GET /api/auth/me -> Return user
  -> Router.push("/") for admin, ("/portal") for developer

User -> Logout Button -> POST /api/auth/logout
  -> Clear cookie -> mutate(null) -> Router.push("/login")
```

---

## 12. Patterns & Conventions

### Naming Conventions

- **Files**: PascalCase for React components (`Sidebar.tsx`, `TopNav.tsx`), camelCase for hooks (`useAuth.ts`), lowercase for lib files (`db.ts`, `auth.ts`)
- **Components**: PascalCase function exports (e.g., `export default function TasksPage()`)
- **Hooks**: `use` prefix (e.g., `useAuth`, `useTasks`, `useDevelopers`)
- **API routes**: RESTful — `route.ts` for collection, `[id]/route.ts` for individual resources
- **Database collections**: Lowercase plural (auto by Mongoose: `developers`, `tasks`)
- **CSS classes**: Custom component classes via Tailwind `@layer components` (e.g., `.btn-primary`, `.card`, `.input-field`, `.select-field`)

### Code Patterns

- **SWR for data fetching**: All frontend data fetching uses SWR hooks with deduplication intervals and `keepPreviousData` for pagination
- **Optimistic UI updates**: After mutations, `mutate()` is called to trigger SWR revalidation (not optimistic, but fast refetch)
- **MongoDB singleton connection**: `connectDB()` in `src/lib/db.ts` caches the connection on the global object to avoid multiple connections in Next.js hot reload
- **Route groups**: Next.js `(dashboard)` route group for admin pages sharing a layout without affecting the URL
- **Dynamic API routes**: `[id]` segments for resource-specific endpoints
- **`cn()` utility**: Combines `clsx` and `tailwind-merge` for conditional, conflict-free class names
- **FormData for file uploads**: Developer create/update and file uploads use `multipart/form-data`
- **JSON for data mutations**: Task create/update uses `application/json`

### Error Handling

- **API routes**: Try-catch blocks wrapping all logic, returning `NextResponse.json({ error: "..." }, { status: ... })`. Errors are logged to console with descriptive prefixes (e.g., `"POST /api/developers error:"`)
- **Frontend**: `apiError(res, fallback)` utility extracts error messages from API responses. `getErrorMessage(err, fallback)` normalizes unknown errors. Errors shown via `toast.error()`
- **No custom error classes**: All errors use standard `Error` or string messages

### Validation

- **Minimal server-side validation**: Login checks for non-empty fields, developer create checks password length (≥4), task import checks for a file and task column
- **Frontend validation**: Required fields checked before API calls, with toast error messages
- **No validation library** (no Zod, Yup, etc.)

### State Management

- **Server state**: SWR hooks with caching
- **Client state**: React `useState` for UI state (filters, modals, form data, pagination)
- **No global state store** (no Redux, Zustand, Context API for app state)

---

## 13. Third-Party Integrations

### Cloudinary (Image CDN)

- **Purpose**: Store developer avatars and task attachment images
- **Configuration**: `src/lib/cloudinary.ts` — configured via `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` environment variables
- **Upload function**: `uploadToCloudinary(file, folder)` converts `File` to `Buffer`, uses `cloudinary.uploader.upload_stream()` with `resource_type: "auto"`, returns `{ url, publicId }`
- **Delete function**: `deleteFromCloudinary(publicId)` — available but not called in any route handler (attachments are not cleaned up on delete)
- **Folders used**: `lobbi/developers` (avatars), `lobbi/attachments` (task images)
- **Next.js image domain**: `res.cloudinary.com` allowed in `next.config.js` `images.remotePatterns`

### MongoDB Atlas (or local)

- **Purpose**: Primary data store
- **Connection**: `src/lib/db.ts` — Mongoose with connection pooling (`maxPoolSize: 10`, `minPoolSize: 2`), socket timeout 30s, server selection timeout 10s
- **Connection caching**: Stored on Node.js `global` to survive Next.js hot reloads

---

## 14. Testing

Not found in codebase. No test files, test framework, or test scripts were detected.

---

## 15. Deployment & CI/CD

### CI/CD Pipelines

Not found in codebase. No `.github/workflows/`, `vercel.json`, `netlify.toml`, `Dockerfile`, or `docker-compose.yml` files were detected.

### Deployment

The project is a standard Next.js application and can be deployed to any platform that supports Next.js (Vercel, Netlify, AWS, Docker, etc.). Available scripts:

```bash
npm run build   # Builds the production bundle
npm start       # Starts the production server
```

---

## 16. Known Tech Debt & Observations

### Security Concerns

1. **Hardcoded admin credentials**: Admin email and password are hardcoded in `src/app/api/auth/login/route.ts` (lines 6-7). These should be moved to environment variables.

2. **No API-level authentication**: None of the API routes (developers, tasks, upload, import) check for authentication or authorization. Any client can directly call `DELETE /api/developers/[id]` or `POST /api/tasks` without being logged in. Auth is enforced only via frontend redirects.

3. **No CSRF protection beyond SameSite=lax**: The cookie-based auth relies on `sameSite: "lax"` for CSRF protection. No CSRF tokens are used.

4. **No rate limiting**: No rate limiting on login or any other API endpoint.

### Missing Features

5. **No `.env.example` file**: New developers have no reference for required environment variables.

6. **No test coverage**: No unit tests, integration tests, or E2E tests exist.

7. **No CI/CD pipeline**: No automated build, test, or deployment configuration.

### Code Quality

8. **Unused dependency**: `date-fns` is listed in `package.json` but the `formatDate` function in `src/lib/utils.ts` uses native `Date.toLocaleDateString()` instead.

9. **Cloudinary orphan resources**: `deleteFromCloudinary()` exists in `src/lib/cloudinary.ts` but is never called. When tasks or developers are deleted, their Cloudinary images remain, leading to storage waste.

10. **Portal stats are page-scoped**: In the developer portal (`src/app/portal/page.tsx`), the stats cards (completed, in-progress, pending) are computed from only the current page of tasks (`tasks.filter(...)`) rather than the full dataset, making them inaccurate for developers with many tasks.

11. **Type casting**: Several places use `any` type (e.g., `err: any`, `developers: any[]` in import route), which bypasses TypeScript's type safety.

12. **No input sanitization**: MongoDB regex search parameters (`search`) are directly interpolated into `$regex` queries without escaping special regex characters, which could cause query errors with inputs like `(`, `[`, `*`.
