# GMS Frontend Workspace

React frontend workspace for greenhouse operations.

## Folder Structure

- `frontend/` - Vite + React application

## Current UI Scope

- Session auth flow (tenant signup, login, logout, profile bootstrap).
- Tenant-scoped greenhouse management page (`/g`).
- Greenhouse-scoped zone/device management page (`/g/{greenhouse_id}`).
- Device control modal with live readings, output commands, and command ACK polling.
- `/` dashboard remains mock-driven for now.

## Stack

- React (JavaScript)
- Tailwind CSS
- Vite

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm

## Setup and Run

From repository root:

```bash
cd frontend/frontend
npm install
npm run dev
```

UI URL: `http://localhost:5173`

Build/lint:

```bash
npm run build
npm run lint
```

## Environment Variables

Create `frontend/frontend/.env.local` only if needed:

```env
VITE_API_BASE_URL=/api
```

- `VITE_API_BASE_URL` - backend REST base URL for all frontend requests

By default, Vite proxies `/api/*` to `http://127.0.0.1:8081/*`.

## Route Map

- `/login` - tenant user login
- `/signup` - create tenant + initial admin user
- `/g` - greenhouse list for current authenticated tenant
- `/g/{greenhouse_id}` - zone/device operations for one greenhouse
- `/` - demo dashboard shell (mock data)

## API Usage Map

### Auth

- `POST /v1/auth/signup`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/auth/me`

### Greenhouses

- `GET /v1/g`
- `POST /v1/g`
- `PATCH /v1/g/{greenhouse_id}`
- `DELETE /v1/g/{greenhouse_id}`
- `GET /v1/g/{greenhouse_id}/gateway-config`

### Zones and Commands (greenhouse-scoped)

- `GET /v1/g/{greenhouse_id}/zones/registry`
- `POST /v1/g/{greenhouse_id}/zones/assign`
- `POST /v1/g/{greenhouse_id}/zones/unassign`
- `POST /v1/g/{greenhouse_id}/zones/sync`
- `POST /v1/g/{greenhouse_id}/zones/command`
- `GET /v1/g/{greenhouse_id}/zones/command-ack?command_id=...`
- `GET /v1/dashboard/live?greenhouse_id=...&zone_id=...`
- `GET /v1/g/{greenhouse_id}/zones/{zone_id}/thresholds`
- `PUT /v1/g/{greenhouse_id}/zones/{zone_id}/thresholds`
- `GET /v1/g/{greenhouse_id}/zones/{zone_id}/thresholds/status`

Note: auth session is cookie-based, so requests use `credentials: "include"`.

## Device Control Modal (`/g/{greenhouse_id}`)

When opening an assigned zone device:

- OUT control grid (`OUT_00..OUT_07`) with HIGH/LOW actions
- Sensor readings (`air_*`, `soil_*`)
- Input states (`din_00..din_03`)
- Output states from telemetry (`dout_00..dout_07`)
- ACK panel (`PENDING/FORWARDED/APPLIED/FAILED/TIMEOUT`) for latest command

Command payload shape sent by frontend:

```json
{
  "action": "SET_OUTPUT",
  "device_id": "portenta-xxxx",
  "zone_id": "zone-a",
  "payload": {
    "channel": 0,
    "state": 1
  }
}
```

## Recommended Local Workflow

1. Start gateway stack (single-node or cluster manager):

```bash
cd firmware/src/gateway
./scripts/up.sh
# or
./scripts/up-cluster.sh
```

2. Start backend:

```bash
cd backend/infra
./scripts/up.sh
```

3. Start frontend:

```bash
cd frontend/frontend
npm run dev
```

4. Open:

- `http://localhost:5173/g`
- `http://localhost:4173` (simulator/cluster manager)

## Troubleshooting

- `http proxy error ... ECONNREFUSED` for `/v1/...` means backend is down/restarting.
- Health check: `curl http://localhost:8081/actuator/health`.
- If requests return `401`, authenticate again from `/login`.
- If greenhouse rename fails with CORS/preflight, verify backend is running latest config (PATCH allowed).

## Contributor Notes

- Auth and app routing: `frontend/frontend/src/App.jsx`
- API client/session behavior: `frontend/frontend/src/services/apiClient.js`
- Greenhouse APIs: `frontend/frontend/src/services/greenhouseApi.js`
- Zone APIs: `frontend/frontend/src/services/zonesApi.js`
