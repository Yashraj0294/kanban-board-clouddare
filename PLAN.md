# Kanban Board — Implementation Plan

> Interview assignment: Trello-like board with drag-and-drop, real-time sync, role-based access.  
> Stack: Nx Monorepo · React (Vite) · NestJS · MongoDB · Socket.IO · Docker

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Tech Stack & Decisions](#2-tech-stack--decisions)
3. [Environment Variables](#3-environment-variables)
4. [Phase 0 — Workspace Bootstrap](#phase-0--workspace-bootstrap)
5. [Phase 1 — Shared Libraries](#phase-1--shared-libraries)
6. [Phase 2 — Backend API (NestJS)](#phase-2--backend-api-nestjs)
7. [Phase 3 — Frontend (React)](#phase-3--frontend-react)
8. [Phase 4 — Real-Time (Socket.IO)](#phase-4--real-time-socketio)
9. [Phase 5 — Testing](#phase-5--testing)
10. [Phase 6 — Docker & Local Dev](#phase-6--docker--local-dev)
11. [Phase 7 — Deployment](#phase-7--deployment)
12. [Commit Strategy](#commit-strategy)
13. [README Checklist](#readme-checklist)

---

## 1. Repository Structure

```
kanban-board/
├── apps/
│   ├── api/                        ← NestJS backend
│   │   └── src/
│   │       ├── auth/               ← JWT login/register, guards
│   │       ├── boards/             ← Board CRUD
│   │       ├── columns/            ← Column CRUD
│   │       ├── cards/              ← Card CRUD + position update
│   │       ├── events/             ← Socket.IO gateway
│   │       ├── users/              ← User model + role
│   │       └── common/             ← Interceptors, pipes, decorators
│   └── web/                        ← React + Vite frontend
│       └── src/
│           ├── components/
│           │   ├── Board/          ← DragDropContext wrapper
│           │   ├── Column/         ← Droppable
│           │   ├── Card/           ← Draggable, memoized
│           │   ├── CardModal/      ← Add / edit form
│           │   └── ThemeToggle/
│           ├── hooks/
│           │   ├── useBoard.ts     ← TanStack Query
│           │   ├── useSocket.ts    ← Socket.IO client
│           │   └── useDnD.ts       ← onDragEnd — isolated, testable
│           ├── context/
│           │   └── AuthContext.tsx ← Decoded JWT role in context
│           ├── store/
│           │   └── boardStore.ts   ← Zustand — optimistic state
│           └── pages/
│               ├── LoginPage.tsx
│               └── BoardPage.tsx
├── libs/
│   ├── shared-types/               ← Card, Column, Board, User, Role, SocketEvents
│   └── shared-constants/           ← Enums, regex, limits
├── docker/
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── docker-compose.yml              ← Local dev (mongo + api + web)
├── docker-compose.prod.yml         ← Production-ready compose
├── .env                            ← ⚠ Never commit — copy from .env.example
├── .env.example                    ← Committed — template with all keys
├── nx.json
├── package.json
└── README.md
```

---

## 2. Tech Stack & Decisions

| Concern | Choice | Reason |
|---|---|---|
| Monorepo | **Nx** | Task graph, remote caching, generators, first-class NestJS + Vite support |
| Frontend | **React 18 + Vite + TypeScript** | Fast HMR, Nx Vite plugin, broad ecosystem |
| Backend | **NestJS** | Opinionated, DI, native Jest, WebSocket gateway built-in |
| Database | **MongoDB 7 + Mongoose** | Flexible schema, nested card/column structure fits documents |
| DnD | **@hello-pangea/dnd** | Active fork of react-beautiful-dnd (rbd is archived) |
| Server state | **TanStack Query v5** | Cache, stale-while-revalidate, refetch on socket event |
| Client state | **Zustand** | Lightweight, optimistic rollback via snapshots |
| Real-time | **Socket.IO** | Per-board rooms, works natively with `@nestjs/platform-socket.io` |
| Auth | **JWT (access token only)** | Stateless, role embedded in payload, simple for assignment scope |
| Testing (BE) | **Jest + Supertest + mongodb-memory-server** | No real DB needed in CI |
| Testing (FE) | **Jest + React Testing Library + msw** | Component + hook tests, mock API |
| Logging | **nestjs-pino** | Structured JSON logs, request ID, duration |
| Containerization | **Docker + Docker Compose** | One command local stack |
| Deployment | **Railway** | Docker-native, free MongoDB plugin, GitHub auto-deploy |

---

## 3. Environment Variables

All secrets live in `.env` (gitignored). Copy `.env.example` and fill in values.

```bash
cp .env.example .env
```

See `.env.example` at the root for all required keys with documentation comments.

---

## Phase 0 — Workspace Bootstrap

**Goal:** Nx monorepo running with apps and libs scaffolded, Docker Compose starting MongoDB.

### Steps

```bash
# 1. Create Nx workspace (choose pnpm when prompted)
npx create-nx-workspace@latest kanban-board --preset=apps --pm=pnpm --nxCloud=skip

cd kanban-board

# 2. Install Nx plugins
pnpm add -D @nx/nest @nx/react @nx/js @nx/vite

# 3. Generate apps
pnpm nx g @nx/nest:app api --directory=apps/api --strict
pnpm nx g @nx/react:app web --directory=apps/web --bundler=vite --style=css --strict

# 4. Generate shared libs
pnpm nx g @nx/js:lib shared-types --directory=libs/shared-types --bundler=tsc --strict
pnpm nx g @nx/js:lib shared-constants --directory=libs/shared-constants --bundler=tsc --strict

# 5. Install backend deps
pnpm add @nestjs/mongoose mongoose @nestjs/config @nestjs/jwt @nestjs/passport \
  passport passport-jwt @nestjs/websockets @nestjs/platform-socket.io socket.io \
  nestjs-pino pino-http pino-pretty bcrypt class-validator class-transformer

pnpm add -D @types/passport-jwt @types/bcrypt mongodb-memory-server supertest @types/supertest

# 6. Install frontend deps
pnpm add @hello-pangea/dnd @tanstack/react-query zustand socket.io-client \
  react-router-dom axios date-fns

pnpm add -D msw @testing-library/react @testing-library/user-event @testing-library/jest-dom

# 7. Verify everything builds
pnpm nx run-many -t build --all
```

### Checklist
- [ ] `pnpm nx graph` shows apps and libs
- [ ] `docker-compose up mongo` starts MongoDB on port 27017
- [ ] `pnpm nx serve api` starts NestJS on port 3000
- [ ] `pnpm nx serve web` starts Vite dev server on port 4200

---

## Phase 1 — Shared Libraries

**Goal:** Single source of truth for types and constants used by both apps.

### `libs/shared-types/src/index.ts`

```typescript
export enum Role {
  VIEWER = 'viewer',
  EDITOR = 'editor',
}

export enum SocketEvent {
  CARD_CREATED  = 'card:created',
  CARD_UPDATED  = 'card:updated',
  CARD_DELETED  = 'card:deleted',
  CARD_MOVED    = 'card:moved',
  COLUMN_CREATED = 'column:created',
  COLUMN_DELETED = 'column:deleted',
}

export interface IUser {
  _id: string;
  email: string;
  role: Role;
}

export interface ICard {
  _id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;      // ISO string
  columnId: string;
  boardId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface IColumn {
  _id: string;
  title: string;
  boardId: string;
  position: number;
}

export interface IBoard {
  _id: string;
  title: string;
  columns: IColumn[];
}

export interface JwtPayload {
  sub: string;    // userId
  email: string;
  role: Role;
}

export interface MoveCardPayload {
  cardId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newPosition: number;
}
```

### `libs/shared-constants/src/index.ts`

```typescript
export const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'] as const;

export const ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
} as const;

export const SOCKET_NAMESPACE = '/board';

export const MAX_CARD_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
```

### Checklist
- [ ] Both libs build: `pnpm nx run-many -t build --projects=shared-types,shared-constants`
- [ ] API and web apps can import from `@kanban/shared-types`

---

## Phase 2 — Backend API (NestJS)

**Goal:** All REST endpoints with auth, role guards, validation, and Jest tests.

### 2.1 — Module Structure

```
apps/api/src/
├── app.module.ts              ← root module, MongooseModule, ConfigModule
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts     ← POST /auth/register, POST /auth/login
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── roles.decorator.ts     ← @Roles('editor')
├── users/
│   ├── user.schema.ts         ← email, passwordHash, role
│   └── users.service.ts
├── boards/
│   ├── board.schema.ts
│   ├── boards.controller.ts
│   ├── boards.service.ts
│   └── dto/
├── columns/
│   ├── column.schema.ts
│   ├── columns.controller.ts
│   ├── columns.service.ts
│   └── dto/
├── cards/
│   ├── card.schema.ts
│   ├── cards.controller.ts    ← includes PATCH /cards/:id/move
│   ├── cards.service.ts
│   └── dto/
├── events/
│   └── board.gateway.ts       ← Socket.IO gateway
└── common/
    ├── logging.interceptor.ts
    └── http-exception.filter.ts
```

### 2.2 — API Endpoints

| Method | Path | Role Required | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account (role in body) |
| POST | `/auth/login` | Public | Returns JWT |
| GET | `/boards` | viewer+ | List boards |
| POST | `/boards` | editor | Create board (seeds default columns) |
| GET | `/boards/:id` | viewer+ | Get board with columns |
| DELETE | `/boards/:id` | editor | Delete board |
| POST | `/boards/:boardId/columns` | editor | Add column |
| PUT | `/columns/:id` | editor | Rename column |
| DELETE | `/columns/:id` | editor | Delete column |
| GET | `/boards/:boardId/cards` | viewer+ | Get all cards for board |
| POST | `/cards` | editor | Create card |
| PUT | `/cards/:id` | editor | Update card fields |
| PATCH | `/cards/:id/move` | editor | Move card (column + position) |
| DELETE | `/cards/:id` | editor | Delete card |

### 2.3 — Mongoose Schemas (key fields)

```typescript
// card.schema.ts
@Schema({ timestamps: true })
export class Card {
  @Prop({ required: true, maxlength: 100 }) title: string;
  @Prop() description: string;
  @Prop() assignee: string;
  @Prop() dueDate: Date;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Column', required: true }) columnId: ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Board', required: true }) boardId: ObjectId;
  @Prop({ required: true }) position: number;
}
```

### 2.4 — Auth Flow

1. `POST /auth/register` → hash password with bcrypt (rounds: 12) → save user with role → return JWT
2. `POST /auth/login` → verify password → return JWT
3. JWT payload: `{ sub: userId, email, role }`
4. `JwtAuthGuard` applied globally, `RolesGuard` applied per-route via `@Roles()` decorator

### 2.5 — Jest Tests

Each module gets a `.spec.ts` file. Uses `mongodb-memory-server` — no real DB in tests.

```
cards.service.spec.ts     ← unit: CRUD, position recalculation on move
cards.controller.spec.ts  ← integration: auth guard, roles guard, DTOs
auth.service.spec.ts      ← unit: register, login, wrong password
boards.service.spec.ts    ← unit: create seeds default 3 columns
```

**Run:** `pnpm nx test api`

### Checklist
- [ ] `pnpm nx test api` — all tests green
- [ ] `pnpm nx serve api` — Swagger at `http://localhost:3000/api` (enable `@nestjs/swagger`)
- [ ] Viewer JWT gets 403 on POST /cards
- [ ] Editor JWT gets 201 on POST /cards

---

## Phase 3 — Frontend (React)

**Goal:** Full board UI with DnD, optimistic updates, role-based rendering, dark/light mode.

### 3.1 — Auth Context

```typescript
// context/AuthContext.tsx
// Decodes JWT from localStorage on mount
// Provides: { user, role, login(), logout() }
// Role used to conditionally render editor controls
```

### 3.2 — Board State Design

```
TanStack Query            ← source of truth from server
      ↓ on mount
Zustand boardStore        ← local working copy for optimistic updates
      ↓ on DnD
useDnD.ts → onDragEnd     ← pure function, easy to unit test
      ↓
  1. Snapshot current Zustand state
  2. Apply move optimistically in Zustand
  3. PATCH /cards/:id/move
  4a. On success → Socket.IO emits to other clients
  4b. On error   → Restore Zustand snapshot (rollback)
```

### 3.3 — `useDnD.ts` (isolated, testable)

```typescript
// Pure function — no side effects, accepts state + returns next state
export function applyCardMove(
  columns: Record<string, ICard[]>,
  source: DraggableLocation,
  destination: DraggableLocation
): Record<string, ICard[]>

// Hook — calls the pure fn, then fires API + socket
export function useDnD(boardId: string)
```

### 3.4 — Role-Based UI

```tsx
const { role } = useAuth();

// Only editors see these:
{role === 'editor' && <AddCardButton />}
{role === 'editor' && <EditCardIcon />}
{role === 'editor' && <DeleteCardIcon />}

// Viewers see a read-only badge
{role === 'viewer' && <span className="badge">View Only</span>}
```

### 3.5 — Dark / Light Mode

- CSS custom properties (`--bg`, `--text`, `--surface`) on `:root` and `[data-theme="dark"]`
- Toggle sets `document.documentElement.dataset.theme`
- Persisted in Zustand with `localStorage` middleware

### 3.6 — Performance

- `React.memo` on `<Card />` — prevents re-renders when sibling cards change
- `useMemo` for per-column card lists sliced from flat array
- `react-window` `<FixedSizeList>` inside `<Column />` when card count > 50

### Checklist
- [ ] Cards drag between all 3 columns
- [ ] Optimistic move shows instantly, rollback works on 500 response
- [ ] Viewer sees no add/edit/delete controls
- [ ] Dark mode toggle persists on refresh
- [ ] `pnpm nx test web` — DnD unit tests green

---

## Phase 4 — Real-Time (Socket.IO)

**Goal:** All open browser tabs see card changes live without refreshing.

### Backend Gateway

```typescript
// events/board.gateway.ts
@WebSocketGateway({ namespace: '/board', cors: { origin: process.env.WEB_URL } })
export class BoardGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('join-board')
  handleJoin(client: Socket, boardId: string) {
    client.join(boardId);
  }

  emit(boardId: string, event: SocketEvent, payload: unknown) {
    this.server.to(boardId).emit(event, payload);
  }
}
```

After every card mutation in `CardsService`, call `boardGateway.emit(...)`.

### Frontend Hook

```typescript
// hooks/useSocket.ts
export function useSocket(boardId: string) {
  useEffect(() => {
    const socket = io(`${API_URL}/board`, { auth: { token } });
    socket.emit('join-board', boardId);

    socket.on(SocketEvent.CARD_MOVED, (payload: MoveCardPayload) => {
      // Update TanStack Query cache → triggers re-render
      queryClient.setQueryData(['cards', boardId], (old) => applyMove(old, payload));
    });

    return () => { socket.disconnect(); };
  }, [boardId]);
}
```

### Checklist
- [ ] Open board in two tabs — move a card in tab 1 → tab 2 updates within ~100ms
- [ ] Closing tab disconnects socket cleanly (no memory leak)

---

## Phase 5 — Testing

### Backend (Jest + Supertest + mongodb-memory-server)

| File | What it tests |
|---|---|
| `auth.service.spec.ts` | register, login, bcrypt, wrong password → 401 |
| `cards.service.spec.ts` | CRUD, `applyMove` position recalculation |
| `cards.controller.spec.ts` | unauthenticated → 401, viewer → 403, editor → 201 |
| `boards.service.spec.ts` | create board seeds exactly 3 default columns |
| `columns.service.spec.ts` | delete column cascades card deletion |

### Frontend (Jest + RTL + msw)

| File | What it tests |
|---|---|
| `applyCardMove.spec.ts` | same-column reorder, cross-column move, no-destination no-op |
| `Card.spec.tsx` | renders title/assignee/due date, editor sees icons, viewer does not |
| `CardModal.spec.tsx` | form validation, submit fires POST, cancel closes modal |
| `useSocket.spec.ts` | incoming socket event updates query cache |

**Run all:**
```bash
pnpm nx run-many -t test --all
```

---

## Phase 6 — Docker & Local Dev

### `docker-compose.yml`

```yaml
version: '3.9'
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports: ['27017:27017']
    volumes: [mongo-data:/data/db]
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASS}
      MONGO_INITDB_DATABASE: ${MONGO_DB}

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    restart: unless-stopped
    ports: ['3000:3000']
    env_file: .env
    depends_on: [mongo]

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    restart: unless-stopped
    ports: ['4200:80']
    env_file: .env
    depends_on: [api]

volumes:
  mongo-data:
```

### `docker/Dockerfile.api`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build api --prod

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "main.js"]
```

### `docker/Dockerfile.web`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build web --prod

FROM nginx:alpine
COPY --from=builder /app/dist/apps/web /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### One-Command Local Start

```bash
cp .env.example .env   # fill in values
docker-compose up --build
```

| Service | URL |
|---|---|
| Web | http://localhost:4200 |
| API | http://localhost:3000 |
| API Docs | http://localhost:3000/api |
| MongoDB | mongodb://localhost:27017 |

### Checklist
- [ ] `docker-compose up --build` starts all 3 services
- [ ] `docker-compose down -v` tears down cleanly
- [ ] No secrets hardcoded in any Dockerfile

---

## Phase 7 — Deployment

### Railway (Recommended)

1. Push repo to GitHub
2. New project on [railway.app](https://railway.app)
3. Add **MongoDB** plugin → copy `MONGO_URL` to env vars
4. Add service for **api**: set root to `/`, build command `pnpm nx build api --prod`
5. Add service for **web**: set root to `/`, build command `pnpm nx build web --prod`
6. Set all env vars from `.env.example` in Railway dashboard
7. Auto-deploys on every push to `main`

### Environment Vars to Set in Railway

See `.env.example` — every variable marked `# REQUIRED IN PROD` must be set.

---

## Commit Strategy

Each commit should be atomic and buildable:

```
feat: phase-0 nx monorepo scaffold with pnpm and docker-compose
feat: phase-1 shared-types and shared-constants libs
feat: phase-2a auth module with jwt and bcrypt
feat: phase-2b boards and columns crud with dto validation
feat: phase-2c cards crud with position move endpoint
feat: phase-2d jest tests for all api modules
feat: phase-3a react auth flow with role context
feat: phase-3b board layout with column and card components
feat: phase-3c drag-and-drop with hello-pangea and useDnD hook
feat: phase-3d optimistic updates with zustand rollback on error
feat: phase-3e dark-light mode toggle with localStorage persist
feat: phase-4 socketio gateway and useSocket hook
feat: phase-5 frontend unit tests for dnd and card components
feat: phase-6 dockerfiles and nginx config for production build
docs: readme with architecture decisions and api reference
chore: railway deployment config and env var documentation
```

---

## README Checklist

- [ ] One-line setup: `cp .env.example .env && docker-compose up --build`
- [ ] Architecture diagram (Mermaid or ASCII)
- [ ] Why each library was chosen (link to this PLAN.md)
- [ ] API endpoint table
- [ ] Role system explanation
- [ ] Real-time design: per-board socket rooms
- [ ] Optimistic UI + rollback description
- [ ] How to run tests: `pnpm nx run-many -t test --all`
- [ ] Live URL
- [ ] Trade-offs & what you'd improve with more time

---

## Implementation Order (Quick Reference)

```
Phase 0  →  Phase 1  →  Phase 2 (2a → 2b → 2c → 2d)
         →  Phase 3 (3a → 3b → 3c → 3d → 3e)
         →  Phase 4
         →  Phase 5
         →  Phase 6
         →  Phase 7
```

Start each phase only after the previous phase's checklist is fully green.
