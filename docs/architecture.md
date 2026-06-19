# Architecture

## System Overview

```
┌──────────────────────────────────────────────┐
│           React + TypeScript UI              │
│  Landing → Pre-Join → Meeting → Summary      │
│  LiveKit React SDK · WebRTC · Tailwind       │
└──────────┬───────────────────────────────────┘
           │ WSS / LiveKit SDK
┌──────────▼───────────────────────────────────┐
│           LiveKit SFU (Go)                    │
│  Media routing · Room state · Auth (JWT)      │
│  Simulcast/SVC · Egress · Agents              │
│  Ports: 7880 HTTP · 7881 WS · 50000-60000 UDP │
└──────────┬───────────────────────────────────┘
           │ HTTP
┌──────────▼───────────────────────────────────┐
│        Backend API (Node.js + Express)        │
│  POST /api/rooms · GET /validate · JWT issue  │
│  Rate limiting · CORS · Structured errors     │
│  PostgreSQL · Redis                           │
└───────────────────────────────────────────────┘
```

## Frontend Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Logo, New Meeting, Join, recent rooms |
| `/prejoin?room=CODE` | PreJoin | Camera preview, name, device selectors |
| `/meeting/CODE` | MeetingRoom | Video grid, controls, chat, participants |
| `/meeting/CODE/summary` | Summary | Duration, participants, return home |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/rooms` | Create room → returns roomCode |
| GET | `/api/rooms/:code/validate` | Check room validity |
| GET | `/api/rooms/:code/token?identity=X` | Get LiveKit JWT |

## Data Flow

### Join a Meeting
```
User clicks Join
  → POST /api/rooms (or validate existing)
  → Backend creates room, returns roomCode
  → GET /api/rooms/:code/token?identity=name
  → Backend signs LiveKit JWT
  → React connects to LiveKit SFU via WSS with JWT
  → Participant appears in room
```

### Screen Share
```
User clicks Share Screen
  → Browser getDisplayMedia() picker
  → New VideoTrack published to LiveKit
  → All participants receive trackSubscribed event
  → UI renders screen as large tile + PIP
```

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Media server | LiveKit SFU | Best DX, AI-ready, YC-backed, open source |
| Frontend framework | React + TypeScript | LiveKit's best SDK support, team familiarity |
| Backend | Node.js + Express | Simple REST, JWT signing, rapid development |
| Database | PostgreSQL | Room metadata, reliable, well-known |
| Cache | Redis | LiveKit room state, rate limiting, pub/sub |
| Containerization | Docker Compose | Dev parity, easy self-host |
| TLS termination | Caddy | Auto-TLS, minimal config |
| Auth | JWT | LiveKit-native, stateless, 1h expiry |
