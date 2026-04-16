# Own-a-Factory

A browser-native factory simulation platform — a modern, open-source alternative to [Factory IO](https://factoryio.com). Build virtual factory layouts, write PLC programs in Structured Text, and simulate industrial automation logic entirely in the browser.

---

## What it does

Engineers and students drag industrial components (sensors, conveyors, cylinders, robots) onto a 3D factory floor, wire their I/O tags to a PLC memory map, write control logic in IEC 61131-3 Structured Text, and run the simulation — all without installing anything.

**Two PLC modes:**
- **Software PLC** — the built-in ST interpreter runs in a Web Worker at 20 Hz
- **Real PLC** — connect a physical PLC via Modbus TCP; the simulation acts as virtual I/O

---

## Goals

| Goal | Description |
|---|---|
| **Browser-native** | No desktop app, no plugins. Babylon.js + WebAssembly physics runs entirely in the browser. |
| **Real-world fidelity** | Generic components match real industrial specs (detection ranges, response times, output types). Brand-specific variants (SICK, Festo, Siemens) extend generics. |
| **Open component system** | Components are self-contained packages (JSON definition + GLTF mesh + behavior script). Anyone can author and publish new types. |
| **IEC 61131-3 ST** | Structured Text interpreter runs in a sandboxed Web Worker. Ladder Logic planned for v2. |
| **Real PLC bridge** | Modbus TCP proxy lets engineers test real PLC programs against a virtual factory — no physical sensors needed. |
| **Education-ready** | Instructor classroom view: watch all student sessions live, assign tasks, track progress. |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (per user)                                          │
│                                                              │
│  Main Thread                       PLC Web Worker           │
│  ┌───────────────────────────┐     ┌──────────────────────┐ │
│  │ Babylon.js  (60 fps)      │◄───►│ ST Interpreter (20Hz)│ │
│  │ ├── Havok physics (WASM)  │     │ ├── Read input tags  │ │
│  │ ├── Component behaviors   │     │ ├── Execute program   │ │
│  │ └── Apply PLC outputs     │     │ └── Return outputs   │ │
│  └───────────────────────────┘     └──────────────────────┘ │
│                │                                             │
│                │ WebSocket (collaboration / Modbus proxy)    │
└────────────────┼─────────────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────┐
│  Backend  (Node.js monolith)                           │
│  ├── REST API  (auth, projects, scenes, components)    │
│  ├── WebSocket hub  (collab rooms, tag streaming)      │
│  ├── Modbus TCP proxy  (real PLC bridge)               │
│  └── Asset pipeline  (GLTF conversion, thumbnails)     │
│                                                        │
│  PostgreSQL   Redis   Object Storage (S3/R2/MinIO)     │
└────────────────────────────────────────────────────────┘
```

**Key decision — simulation runs client-side.** The server handles persistence, auth, collaboration, and the optional real-PLC protocol proxy. No server compute per active simulation session.

### Simulation loop (50 ms / 20 Hz)

1. Babylon.js physics step (Havok WASM) — boxes move, gravity, collisions
2. Component behavior tick — IR sensors raycast → update output tags; conveyors apply velocity
3. `postMessage` → PLC Web Worker: send all current sensor tag values
4. PLC Worker executes ST program → computes output coils
5. `postMessage` back → apply outputs (start/stop conveyors, extend cylinders)
6. Visual feedback — sensor glow, belt animation, tag overlay updates

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, CSS Modules |
| 3D Engine | Babylon.js + Havok WASM physics *(wired in next milestone)* |
| PLC Runtime | Custom IEC 61131-3 ST interpreter (Web Worker) *(next milestone)* |
| API Server | Fastify 5, Node.js, TypeScript ESM |
| Auth | JWT (HS256), bcrypt |
| Database | PostgreSQL + Drizzle ORM |
| Cache / PubSub | Redis |
| Object Storage | S3-compatible (MinIO / Cloudflare R2 / AWS S3) |
| WebSocket | `@fastify/websocket` (ws under the hood) |
| Monorepo | pnpm workspaces + Turborepo |

---

## Repository Layout

```
own-a-factory/
├── apps/
│   ├── api/                  Fastify server
│   │   └── src/
│   │       ├── plugins/      auth, cors, websocket
│   │       └── routes/       auth, projects, scenes, components, ws
│   └── web/                  Next.js app
│       └── src/
│           ├── app/          pages (login, register, dashboard, editor)
│           ├── components/
│           │   ├── dashboard/ ProjectCard
│           │   └── editor/   EditorLayout, ComponentLibrary,
│           │                 PropertiesPanel, Viewport, BottomPanel
│           └── lib/          api.ts (typed fetch), auth.ts (JWT helpers)
├── packages/
│   ├── types/                shared TypeScript types (no build step)
│   │   └── src/
│   │       ├── component.ts  ComponentDefinition, ComponentInstance, IOTag
│   │       ├── scene.ts      SceneData, WiringEntry, PLCProgram, PLCConnection
│   │       ├── plc.ts        TagSnapshot, PLCTickMessage, WSMessage types
│   │       └── api.ts        API request / response shapes
│   └── db/                   Drizzle schema + postgres client
│       └── src/schema/
│           ├── users.ts      users, orgs, org_members
│           ├── projects.ts   projects, scenes
│           ├── components.ts component_types, component_assets
│           └── sessions.ts   sessions, tag_history
├── tsconfig.base.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Local Setup

### Prerequisites

- **Node.js** ≥ 20 (`node --version`)
- **pnpm** ≥ 9 (`npm i -g pnpm`)
- **PostgreSQL** ≥ 15 running locally (or Docker)
- **Redis** ≥ 7 running locally (or Docker)

### 1. Clone and install

```bash
git clone <repo-url> own-a-factory
cd own-a-factory
pnpm install
```

### 2. Start infrastructure (Docker shortcut)

```bash
# PostgreSQL on 5432, Redis on 6379
docker run -d --name oaf-postgres \
  -e POSTGRES_DB=own_a_factory \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine

docker run -d --name oaf-redis \
  -p 6379:6379 redis:7-alpine
```

Or use an existing local PostgreSQL / Redis instance.

### 3. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/own_a_factory
JWT_SECRET=your-secret-here-min-32-chars
CORS_ORIGIN=http://localhost:3000
PORT=4000
NODE_ENV=development
```

### 4. Run database migrations

```bash
cd packages/db
pnpm db:generate   # generate migration files from schema
pnpm db:migrate    # apply to your local database
cd ../..
```

### 5. Start development servers

```bash
# In one terminal — API (port 4000)
cd apps/api
pnpm dev

# In another terminal — Next.js (port 3000)
cd apps/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) → register an account → create a project.

### 6. (Optional) Configure web API URL

The web app reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`). Create `apps/web/.env.local` if your API runs elsewhere:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Environment Variables Reference

### `apps/api/.env`

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | HS256 signing secret (min 32 chars) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `PORT` | `4000` | HTTP + WebSocket port |
| `LOG_LEVEL` | `info` | Pino log level |
| `NODE_ENV` | `development` | Enables pino-pretty in dev |

### `apps/web/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API base URL |

---

## API Overview

```
POST   /auth/register          Register new user → { token, user }
POST   /auth/login             Login → { token, user }
GET    /auth/me                Current user (JWT required)

GET    /projects               List user's projects
POST   /projects               Create project
GET    /projects/:id           Get project
PATCH  /projects/:id           Update project name/description
DELETE /projects/:id           Delete project

GET    /projects/:id/scenes              List scene versions
GET    /projects/:id/scenes/latest       Get latest scene data
GET    /projects/:id/scenes/:version     Get specific version
POST   /projects/:id/scenes              Save scene (autosave or manual)

GET    /components             List components (filter: category, tier, search)
GET    /components/:id         Get component + asset URLs
POST   /components             Register custom component (JWT required)

WS     /ws                     WebSocket: join session, tag_delta broadcast,
                               status heartbeat, modbus_connect (stub)
```

---

## Component System

Every factory component is a self-contained package:

```
ir-proximity-generic/
├── component.json      id, category, parameters, io_tags, behavior
├── mesh.glb            GLTF 2.0 binary (primary 3D format)
├── thumbnail.png       128×128 UI preview
└── behavior.js         optional custom simulation script (sandboxed)
```

**Generic components** ship with the platform (correct industrial specs, no brand markings).  
**Brand extensions** override only what differs (mesh + parameter defaults):

```json
{
  "id": "sick-wl12-2p430",
  "extends": "photoelectric-generic",
  "brand": "SICK",
  "model": "WL12-2P430",
  "parameter_overrides": { "detection_range": { "default": 200, "max": 300 } }
}
```

---

## Scene Data Format

Scenes are stored as JSON in PostgreSQL (`scenes.data`):

```json
{
  "version": 1,
  "components": [
    {
      "instanceId": "sensor-a",
      "typeId": "ir-proximity-generic",
      "position": [1.5, 0.0, 0.5],
      "rotation": [0, 90, 0],
      "paramValues": { "detection_range": 200 },
      "tagAlias": "Sensor_1"
    }
  ],
  "wiring": [
    { "componentTag": "Sensor_1.output", "plcAddress": "I0.0" },
    { "componentTag": "Conveyor_1.run",  "plcAddress": "Q0.0" }
  ],
  "plcProgram": {
    "language": "ST",
    "source": "IF Sensor1 THEN Conveyor1 := TRUE; END_IF;"
  }
}
```

For **Real PLC mode**, add a `plcConnection` block:

```json
{
  "plcConnection": {
    "protocol": "modbus-tcp",
    "host": "192.168.1.10",
    "port": 502,
    "pollInterval": 50,
    "registerMap": [
      { "register": "10001", "type": "coil", "tag": "Sensor_1.output" },
      { "register": "00001", "type": "coil", "tag": "Conveyor_1.run" }
    ]
  }
}
```

---

## Roadmap

- [x] Monorepo scaffold (pnpm + Turborepo)
- [x] Shared types package
- [x] PostgreSQL schema (Drizzle ORM)
- [x] Fastify API — auth, projects, scenes, components, WebSocket hub
- [x] Next.js app — login/register, dashboard, scene editor shell (3-panel layout)
- [ ] Babylon.js 3D viewport integration
- [ ] Drag-and-drop component placement
- [ ] IEC 61131-3 ST interpreter (Web Worker)
- [ ] I/O tag wiring (table + node graph views, in sync)
- [ ] Component behavior scripts (IR proximity, conveyor, cylinder)
- [ ] Modbus TCP proxy (real PLC bridge)
- [ ] Component Builder wizard (upload mesh → define params → publish)
- [ ] Onboarding tutorial (guided template + tooltip flow)
- [ ] Classroom / instructor view

---

## Development Scripts

```bash
# Root — run all apps in parallel
pnpm dev

# Typecheck everything
pnpm typecheck

# Individual packages
cd packages/db  && pnpm db:generate   # generate Drizzle migrations
cd packages/db  && pnpm db:migrate    # apply migrations
cd packages/db  && pnpm db:studio     # open Drizzle Studio (DB browser)
```
