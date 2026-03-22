# Municipal OS — Frontend Infrastructure

Complete reference for the React + TypeScript frontend. No code is written at this stage — this document defines the full stack, architecture, project structure, and conventions for when FE development begins.

---

## Build Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | latest | Dev server with instant HMR, optimized production builds |
| TypeScript | 5.x | Strict mode enabled, compile-time type safety across all layers |

**Scaffolding command:**

```bash
npm create vite@latest frontend -- --template react-ts
```

Vite is chosen over CRA and Next.js because Municipal OS is a single-page application that talks to a separate .NET API — no SSR or file-based API routes are needed. Vite provides the fastest dev experience with native ES modules and Rollup-based production bundling.

---

## Core Libraries

### TanStack Ecosystem

The TanStack suite provides type-safe, headless primitives that work together cohesively. All four libraries share the same philosophy: framework-agnostic core logic with thin React adapters.

| Library | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-router` | v1.x | Type-safe, file-based routing with built-in URL search param state management |
| `@tanstack/react-query` | v5.x | Server state management — caching, background refetching, optimistic updates, mutations |
| `@tanstack/react-form` | v1.x | Type-safe form state with field-level validation via Zod adapter |
| `@tanstack/react-table` | latest | Headless table for officer pending queue, admin audit logs, application lists |

**Why TanStack Router over React Router:**

- Route params, search params, and loader data are fully type-safe end-to-end
- Built-in search param serialization eliminates manual `useSearchParams` parsing
- File-based routing convention matches the mental model of "pages" for a dashboard app
- Pending UI and route-level data loading are first-class features

**Why TanStack Query for all API calls:**

- Automatic cache management — deduplicate identical requests, serve stale data while revalidating
- Mutation hooks with `onMutate` / `onSuccess` / `onError` for optimistic UI on approve/reject actions
- `queryKey` invalidation makes it trivial to refresh the pending queue after an officer action
- Background refetching keeps the officer dashboard current without manual polling
- Devtools for inspecting cache during development

### Validation

| Library | Purpose |
|---------|---------|
| `zod` | Schema-based validation — used with TanStack Form adapter for client-side validation and for typing API responses |

Zod schemas will mirror the backend's FluentValidation rules. Shared validation logic (e.g., email format, required fields, file size limits) lives in `src/lib/validators/`.

### UI / Styling

| Library | Purpose |
|---------|---------|
| Tailwind CSS v4 | Utility-first CSS via `@tailwindcss/vite` plugin — no PostCSS config or `tailwind.config.js` needed |
| shadcn/ui | Copy-and-own components built on Radix UI primitives (accessible, unstyled headless components) |
| Lucide React | Icon library, used by shadcn/ui components |

**shadcn/ui components to install:**

| Component | Where it's used |
|-----------|----------------|
| Button | All forms, action buttons |
| Card | Dashboard cards, application summary |
| Dialog | Confirmation dialogs (approve, reject, delete) |
| Dropdown Menu | User menu, action menus |
| Input / Textarea | All forms |
| Label | Form labels |
| Select | Service type selection, role selection |
| Table | Pending queue, audit logs, application list |
| Tabs | Admin panel sections, application detail views |
| Badge | Status indicators (Submitted, Approved, Rejected) |
| Separator | Visual dividers |
| Sheet | Mobile sidebar |
| Skeleton | Loading states |
| Toast (via Sonner) | Success/error notifications |
| Progress | Application status progress bar |
| Avatar | User menu |
| Alert | System messages, validation errors |

### Client State

| Library | Purpose |
|---------|---------|
| Zustand | Lightweight global store for auth token, current user object, sidebar open/close state |

Zustand is chosen over Redux because the client-side state surface is small. Server state (applications, service types, notifications) lives in TanStack Query's cache — Zustand only manages UI state and the auth session.

### HTTP Client

| Library | Purpose |
|---------|---------|
| Axios | HTTP client with request/response interceptors for JWT injection and 401 handling |

The Axios instance is configured once in `src/lib/api.ts`:

- **Request interceptor**: Reads JWT from Zustand store, attaches as `Authorization: Bearer <token>` header
- **Response interceptor**: On 401, clears auth state and redirects to login. On 5xx, shows a global error toast via Sonner

### Notifications / Toast

| Library | Purpose |
|---------|---------|
| Sonner | Toast notifications — integrates with shadcn/ui's Toaster component |

### Date Handling

| Library | Purpose |
|---------|---------|
| date-fns | Lightweight date formatting and manipulation — `formatDistanceToNow`, `format`, `parseISO` |

### File Upload

| Library | Purpose |
|---------|---------|
| react-dropzone | Drag-and-drop file upload UI for the citizen document upload step |

### Dev Tooling

| Library | Purpose |
|---------|---------|
| `@tanstack/react-query-devtools` | Inspect query cache, active/stale/inactive queries during development |
| `@tanstack/react-router-devtools` | Inspect route tree, params, and search state |
| ESLint | Code quality linting |
| Prettier | Code formatting |

---

## Package Installation

```bash
cd frontend

# Core TanStack
npm i @tanstack/react-router @tanstack/react-query @tanstack/react-form @tanstack/react-table

# Validation
npm i zod @tanstack/zod-form-adapter

# Styling
npm i -D @tailwindcss/vite tailwindcss
npm i lucide-react class-variance-authority clsx tailwind-merge

# State & HTTP
npm i zustand axios

# Utilities
npm i sonner date-fns react-dropzone

# Dev tools
npm i -D @tanstack/react-query-devtools @tanstack/react-router-devtools
npm i -D @tanstack/router-plugin

# shadcn/ui init (interactive)
npx shadcn@latest init
```

---

## Project Structure

```
frontend/
├── src/
│   ├── routes/                      # TanStack Router — file-based routing
│   │   ├── __root.tsx               # Root layout: <Outlet />, Toaster, devtools
│   │   ├── index.tsx                # Landing page → redirects to login or dashboard
│   │   ├── login.tsx                # Login page
│   │   ├── register.tsx             # Citizen registration page
│   │   │
│   │   ├── _authenticated.tsx       # Auth layout guard — redirects to /login if no token
│   │   ├── _authenticated/
│   │   │   ├── citizen/
│   │   │   │   ├── dashboard.tsx    # My applications list, apply button
│   │   │   │   ├── apply.tsx        # Multi-step: select service → upload docs → submit
│   │   │   │   └── applications.$id.tsx  # Application detail with status timeline
│   │   │   │
│   │   │   ├── officer/
│   │   │   │   ├── dashboard.tsx    # Pending queue table with filters
│   │   │   │   └── review.$id.tsx   # Full application review with approve/reject/request-docs
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── services.tsx     # CRUD for service types + required documents
│   │   │       ├── workflows.tsx    # Workflow builder: define steps + role per step
│   │   │       ├── officers.tsx     # Assign roles to users
│   │   │       └── audit-logs.tsx   # Searchable audit log table
│   │   │
│   │   └── _authenticated.tsx       # (layout route with auth guard + sidebar)
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui generated components (do not edit directly)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx      # Sidebar nav — links change based on user role
│   │   │   ├── top-nav.tsx          # Top bar: notifications bell, user avatar dropdown
│   │   │   └── auth-guard.tsx       # Route-level auth check component
│   │   └── shared/
│   │       ├── status-badge.tsx     # Color-coded badge for application status
│   │       ├── status-timeline.tsx  # Vertical timeline of status history entries
│   │       ├── file-uploader.tsx    # Dropzone wrapper with preview and validation
│   │       ├── data-table.tsx       # Generic TanStack Table wrapper with sorting/filtering/pagination
│   │       ├── confirm-dialog.tsx   # Reusable confirmation dialog
│   │       └── page-header.tsx      # Page title + breadcrumbs
│   │
│   ├── lib/
│   │   ├── api.ts                   # Axios instance: base URL, JWT interceptor, error interceptor
│   │   ├── auth.ts                  # Token storage helpers: getToken, setToken, clearToken
│   │   ├── utils.ts                 # cn() class merge helper, date formatters
│   │   └── validators/
│   │       ├── auth.ts              # Zod schemas for login/register forms
│   │       ├── application.ts       # Zod schemas for application submission
│   │       └── service-type.ts      # Zod schemas for admin service type forms
│   │
│   ├── hooks/
│   │   ├── use-auth.ts              # Convenience hook wrapping Zustand auth store
│   │   └── queries/                 # TanStack Query hook files — one per API module
│   │       ├── use-applications.ts  # useMyApplications, useApplication, useSubmitApplication, useApprove, useReject
│   │       ├── use-service-types.ts # useServiceTypes, useCreateServiceType
│   │       ├── use-notifications.ts # useNotifications
│   │       ├── use-workflows.ts     # useWorkflow, useCreateWorkflow
│   │       ├── use-documents.ts     # useUploadDocument, useDocument
│   │       ├── use-municipalities.ts # useMunicipalities
│   │       ├── use-users.ts         # useUser, useUpdateUser
│   │       └── use-audit-logs.ts    # useAuditLogs (admin)
│   │
│   ├── stores/
│   │   └── auth-store.ts           # Zustand store: token, user, isAuthenticated, login(), logout()
│   │
│   ├── types/
│   │   └── api.ts                   # TypeScript interfaces matching backend DTOs
│   │
│   ├── main.tsx                     # App entry: RouterProvider, QueryClientProvider
│   └── index.css                    # @import "tailwindcss" (Tailwind v4 entry)
│
├── components.json                  # shadcn/ui configuration
├── vite.config.ts                   # Vite config: TanStack Router plugin, Tailwind plugin, proxy
├── tsconfig.json                    # TypeScript strict config with path aliases
└── package.json
```

---

## Routing Architecture

### File-Based Route Convention

TanStack Router uses file-system conventions to generate a type-safe route tree.

| Convention | Meaning |
|------------|---------|
| `__root.tsx` | Root layout wrapping all routes |
| `_authenticated.tsx` | Pathless layout route — adds auth guard without a URL segment |
| `_authenticated/citizen/dashboard.tsx` | Renders at `/citizen/dashboard` inside the auth layout |
| `applications.$id.tsx` | Dynamic segment — `$id` becomes a typed route param |
| `index.tsx` | Index route for a directory (e.g., `/citizen/` → `citizen/index.tsx`) |

### Route-Level Data Loading

Each route can define a `loader` function that prefetches data via TanStack Query before rendering:

```typescript
// routes/_authenticated/officer/dashboard.tsx
export const Route = createFileRoute('/_authenticated/officer/dashboard')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(pendingApplicationsQueryOptions()),
  component: OfficerDashboard,
})
```

This ensures the pending queue data is available instantly when the officer navigates to their dashboard — no loading spinner on initial render.

### Auth-Guarded Routes

The `_authenticated.tsx` layout route checks the Zustand auth store. If no valid token exists, it redirects to `/login` with a `redirect` search param so the user returns to their intended page after login.

```typescript
// routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AuthenticatedLayout,
})
```

### Role-Based Route Access

Inside the auth layout, each role-specific directory (`citizen/`, `officer/`, `admin/`) further checks the user's role from the auth store. If a citizen tries to access `/admin/services`, the `beforeLoad` hook redirects them to their own dashboard.

---

## State Management Strategy

### Server State — TanStack Query

All data fetched from the .NET API lives in TanStack Query's cache. This includes:

| Data | Query Key | Stale Time |
|------|-----------|------------|
| My applications (citizen) | `['applications', 'my']` | 30s |
| Pending applications (officer) | `['applications', 'pending']` | 15s (more frequent updates) |
| Application detail | `['applications', id]` | 30s |
| Service types | `['service-types']` | 5 min (rarely changes) |
| Municipalities | `['municipalities']` | 10 min (static data) |
| Notifications | `['notifications']` | 10s (near-real-time) |
| Workflow steps | `['workflows', serviceTypeId]` | 5 min |
| Audit logs (admin) | `['audit-logs', filters]` | 30s |

**Mutation → Invalidation pattern:**

When an officer approves an application, the mutation's `onSuccess` invalidates `['applications', 'pending']` and `['applications', id]` so both the queue and the detail view refresh automatically.

### Client State — Zustand

Zustand manages only non-server state:

| Store | State | Persisted? |
|-------|-------|------------|
| `authStore` | `token`, `user`, `isAuthenticated` | Yes (localStorage) |
| `uiStore` (optional) | `sidebarOpen`, `theme` | Yes (localStorage) |

The auth store shape:

```typescript
interface AuthState {
  token: string | null
  user: {
    id: string
    email: string
    fullName: string
    role: 'Citizen' | 'WardOfficer' | 'MunicipalOfficer' | 'Admin'
    municipalityId: string
  } | null
  isAuthenticated: boolean
  login: (token: string, user: AuthState['user']) => void
  logout: () => void
}
```

---

## API Layer

### Axios Instance (`src/lib/api.ts`)

A single Axios instance configured with:

- `baseURL`: `http://localhost:5000/api` (proxied through Vite in development)
- Request interceptor: Attaches `Authorization: Bearer <token>` from Zustand store
- Response interceptor: Handles 401 (clear auth, redirect to login) and 5xx (show error toast)

### Vite Dev Proxy

During development, the Vite dev server proxies API requests to avoid CORS issues:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

### TanStack Query Hooks Pattern

Each API module has a dedicated hook file in `src/hooks/queries/`. Every hook follows a consistent pattern:

```typescript
// hooks/queries/use-applications.ts
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Application } from '@/types/api'

export const myApplicationsQueryOptions = () =>
  queryOptions({
    queryKey: ['applications', 'my'],
    queryFn: () => api.get<Application[]>('/applications/my').then(r => r.data),
  })

export function useSubmitApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { serviceTypeId: string }) =>
      api.post('/applications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'my'] })
    },
  })
}
```

---

## TypeScript Interfaces (`src/types/api.ts`)

Interfaces mirror the backend DTOs exactly:

```typescript
export interface User {
  id: string
  email: string
  fullName: string
  role: RoleName
  municipalityId: string
  createdAt: string
}

export type RoleName = 'Citizen' | 'WardOfficer' | 'MunicipalOfficer' | 'Admin'

export type ApplicationStatus =
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Rejected'
  | 'DocumentsRequested'

export interface Application {
  id: string
  citizenId: string
  serviceTypeId: string
  status: ApplicationStatus
  currentStep: number
  submittedAt: string
}

export interface ServiceType {
  id: string
  name: string
  description: string
  municipalityId: string
  requiredDocuments: RequiredDocument[]
}

export interface RequiredDocument {
  id: string
  name: string
  required: boolean
}

export interface WorkflowDefinition {
  id: string
  serviceTypeId: string
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  stepOrder: number
  roleRequired: RoleName
}

export interface ApplicationDocument {
  id: string
  applicationId: string
  documentName: string
  filePath: string
  uploadedAt: string
}

export interface StatusHistoryEntry {
  id: string
  applicationId: string
  status: ApplicationStatus
  changedBy: string
  changedAt: string
  comment: string | null
}

export interface AuditLogEntry {
  id: string
  eventType: string
  userId: string
  applicationId: string | null
  timestamp: string
  metadata: Record<string, unknown>
}

export interface Notification {
  id: string
  userId: string
  message: string
  isRead: boolean
  sentAt: string
}

export interface Municipality {
  id: string
  name: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  municipalityId: string
}
```

---

## Page-by-Page Breakdown

### Public Pages

#### Login (`/login`)

- Email + password form validated with Zod
- On success: store token and user in Zustand, redirect to role-appropriate dashboard
- "Don't have an account? Register" link
- Municipality dropdown on register page (fetched from `GET /municipalities`)

#### Register (`/register`)

- Fields: Full name, Email, Password, Confirm Password, Municipality (dropdown)
- Zod validation: email format, password min length (8), passwords match
- On success: auto-login and redirect to citizen dashboard

### Citizen Pages

#### Dashboard (`/citizen/dashboard`)

- **Stats row**: Total applications, Pending, Approved, Rejected (derived from query data)
- **"Apply for New Service" button** → navigates to `/citizen/apply`
- **Applications table** (TanStack Table):
  - Columns: Service Type, Status (badge), Submitted Date, Actions (View)
  - Sortable by date, filterable by status
  - Click row → `/citizen/applications/$id`

#### Apply for Service (`/citizen/apply`)

Multi-step form using TanStack Form:

1. **Step 1 — Select Service Type**: Dropdown of available service types for the user's municipality. On selection, display required documents list.
2. **Step 2 — Upload Documents**: One dropzone per required document. Optional documents shown separately. File type validation (PDF, JPG, PNG). Size limit indicator.
3. **Step 3 — Review & Submit**: Summary of selected service and uploaded documents. Submit button calls `POST /applications` then uploads each document via `POST /documents/upload`.

On success: redirect to the new application's detail page with a success toast.

#### Application Detail (`/citizen/applications/$id`)

- **Header**: Application ID, Service Type name, current status badge
- **Status Timeline** (custom component): Vertical timeline showing each status change with date, officer name, and comment. Highlights the current step.
- **Progress Bar**: Visual indicator showing which workflow step the application is at (e.g., "Step 1 of 2: Ward Review")
- **Documents Section**: List of uploaded documents with download links
- **Certificate Download**: If status is `Approved`, show a prominent "Download Certificate" button calling `GET /applications/{id}/certificate`

### Officer Pages

#### Dashboard (`/officer/dashboard`)

- **Pending Queue Table** (TanStack Table):
  - Columns: Application ID, Citizen Name, Service Type, Submitted Date, Days Pending
  - Sortable by all columns, filterable by service type
  - Row click → `/officer/review/$id`
- Auto-refreshes every 15 seconds via TanStack Query's `refetchInterval`

#### Application Review (`/officer/review/$id`)

- **Left panel**: Full application details — citizen info, service type, status timeline, workflow progress
- **Right panel**: Uploaded documents with inline preview / download
- **Action bar** (fixed at bottom):
  - **Approve**: Opens confirmation dialog with optional comment textarea → `POST /applications/{id}/approve`
  - **Reject**: Opens dialog with required comment → `POST /applications/{id}/reject`
  - **Request Documents**: Opens dialog with comment explaining what's needed → `POST /applications/{id}/request-documents`
- On action success: invalidate queries, redirect back to dashboard with toast

### Admin Pages

#### Service Types (`/admin/services`)

- **Table** listing all service types with name, description, document count
- **Create button** → opens dialog/drawer with form: name, description, municipality, dynamic list of required documents (add/remove rows)
- **Edit** → same form pre-filled with existing data
- Uses `POST /service-types` and `PATCH /service-types/{id}`

#### Workflows (`/admin/workflows`)

- Select a service type → displays its workflow definition
- **Step builder**: Ordered list of steps, each with a role dropdown (WardOfficer / MunicipalOfficer). Add step, remove step, reorder via drag (or up/down buttons for simplicity).
- Save → `POST /workflows`
- Visual preview of the workflow as a horizontal step diagram

#### Officer Assignment (`/admin/officers`)

- Table of users with their current roles
- Inline role selector to promote a user to WardOfficer or MunicipalOfficer
- Uses `PATCH /users/{id}`

#### Audit Logs (`/admin/audit-logs`)

- **Filter bar**: Date range picker, event type dropdown, user search, application ID search
- **Table** (TanStack Table with server-side pagination):
  - Columns: Timestamp, Event Type, User, Application ID, Metadata (expandable)
  - Server-side pagination via query params on `GET /admin/audit-logs`

---

## Component Architecture Conventions

### Shared Component Design

All shared components in `src/components/shared/` follow these conventions:

- Accept data and callbacks as props — no internal API calls
- Use `className` prop for styling overrides via `cn()` (Tailwind merge)
- Compose shadcn/ui primitives rather than building from scratch
- Export both the component and its props type

### Status Badge Mapping

```typescript
const statusConfig: Record<ApplicationStatus, { label: string; variant: string }> = {
  Submitted: { label: 'Submitted', variant: 'secondary' },
  UnderReview: { label: 'Under Review', variant: 'warning' },
  Approved: { label: 'Approved', variant: 'success' },
  Rejected: { label: 'Rejected', variant: 'destructive' },
  DocumentsRequested: { label: 'Docs Requested', variant: 'outline' },
}
```

### Data Table Wrapper

A generic `DataTable<T>` component wraps TanStack Table with shadcn/ui's `<Table>`. It accepts:

- `columns: ColumnDef<T>[]`
- `data: T[]`
- Optional: `pagination`, `sorting`, `filtering` configs
- Optional: `onRowClick` handler

This is used consistently for the citizen applications list, officer pending queue, and admin audit logs.

---

## Authentication Flow

```
1. User submits login form
2. POST /auth/login → receives { token, user }
3. authStore.login(token, user) stores in Zustand + persists to localStorage
4. Axios interceptor picks up token for subsequent requests
5. Router redirects to role-appropriate dashboard:
   - Citizen → /citizen/dashboard
   - WardOfficer / MunicipalOfficer → /officer/dashboard
   - Admin → /admin/services
6. On 401 response → authStore.logout() → redirect to /login
7. On manual logout → clear store + localStorage → redirect to /login
```

### Token Persistence

The Zustand store uses the `persist` middleware with `localStorage` as the storage backend. On app load, the store rehydrates the token and user. TanStack Router's `beforeLoad` hook checks `isAuthenticated` before rendering protected routes.

---

## Error Handling Strategy

| Layer | Handling |
|-------|----------|
| **Form validation** | Zod schemas in TanStack Form — inline field errors shown below each input |
| **API errors (4xx)** | Axios response interceptor parses error body, mutation's `onError` shows specific toast |
| **Network errors** | Axios interceptor catches network failures, shows "Connection error" toast with retry suggestion |
| **Auth errors (401)** | Interceptor clears auth state, redirects to login |
| **Route errors** | TanStack Router's `errorComponent` on each route shows a contextual error boundary |
| **Unexpected errors** | React Error Boundary at root level with "Something went wrong" fallback UI |

---

## Development Workflow

### Local Development Setup

```bash
# 1. Start backend infrastructure
docker-compose up -d          # PostgreSQL, RabbitMQ, MinIO

# 2. Start backend API
cd backend/src/MunicipalOS.Api
dotnet run                     # Runs on http://localhost:5000

# 3. Start frontend dev server
cd frontend
npm install
npm run dev                    # Runs on http://localhost:5173, proxies /api to :5000
```

### Key Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### Code Quality

- **ESLint**: Enforces consistent patterns, catches common React mistakes (exhaustive deps, no unused vars)
- **Prettier**: Autoformats on save — single quotes, no semicolons, 2-space indent (configurable)
- **TypeScript strict mode**: `noUncheckedIndexedAccess`, `strictNullChecks`, `noImplicitAny` all enabled

---

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Tailwind CSS v4 Setup

Tailwind v4 uses the Vite plugin directly — no `tailwind.config.js` or PostCSS config needed.

```css
/* src/index.css */
@import "tailwindcss";
```

Custom theme tokens (colors, spacing) are defined via CSS custom properties in `index.css` following shadcn/ui conventions.

---

## Dependency Summary

### Production Dependencies

| Package | Purpose |
|---------|---------|
| react, react-dom | UI framework |
| @tanstack/react-router | Routing |
| @tanstack/react-query | Server state |
| @tanstack/react-form | Form management |
| @tanstack/react-table | Data tables |
| @tanstack/zod-form-adapter | Zod ↔ TanStack Form bridge |
| zod | Validation schemas |
| zustand | Client state |
| axios | HTTP client |
| sonner | Toast notifications |
| date-fns | Date formatting |
| react-dropzone | File upload |
| lucide-react | Icons |
| class-variance-authority | Component variant helpers (shadcn/ui) |
| clsx | Conditional class names |
| tailwind-merge | Tailwind class deduplication |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| vite | Build tool |
| @vitejs/plugin-react | React fast-refresh for Vite |
| typescript | Type checking |
| @tailwindcss/vite | Tailwind CSS v4 Vite plugin |
| tailwindcss | Tailwind CSS engine |
| @tanstack/react-query-devtools | Query cache inspector |
| @tanstack/react-router-devtools | Route state inspector |
| @tanstack/router-plugin | File-based route generation |
| eslint | Linting |
| prettier | Formatting |

---

## Implementation Order

When FE development begins, build in this sequence:

| Phase | Scope | API Dependencies |
|-------|-------|------------------|
| 1 | Project scaffolding: Vite, Tailwind, shadcn/ui, TanStack Router, path aliases | None |
| 2 | Auth flow: login page, register page, Zustand auth store, Axios interceptor, auth guard layout | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `GET /municipalities` |
| 3 | Citizen dashboard: application list, apply flow, document upload | `GET /applications/my`, `POST /applications`, `POST /documents/upload`, `GET /service-types` |
| 4 | Application detail: status timeline, progress bar, certificate download | `GET /applications/{id}`, `GET /applications/{id}/certificate` |
| 5 | Officer dashboard: pending queue, review page, approve/reject/request-docs | `GET /applications/pending`, `POST .../approve`, `POST .../reject`, `POST .../request-documents` |
| 6 | Admin panel: service type CRUD, workflow builder, officer assignment | `POST /service-types`, `POST /workflows`, `PATCH /users/{id}` |
| 7 | Admin audit logs, notifications bell | `GET /admin/audit-logs`, `GET /notifications` |
| 8 | Polish: loading skeletons, error boundaries, responsive sidebar, mobile layout | None |
