# Spin the Wheel — Next.js + TypeScript + Motion

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — lands directly on the spin game.

For production participant storage (Supabase PostgreSQL), see [docs/BACKEND.md](./docs/BACKEND.md).

## Features

- **Wheel** — 8-slice spin with Motion easing (2.5s curve)
- **Sounds** — looping spin (`spine.wav`), win (`Win.mp3`), loss (`loss.wav`)
- **Prize stock** — localStorage counters; at max, prize slices become “Better Luck Next Time”
- **Result modal** — prize reveal → details form (Name + UAE contact) → success
- **Backend** — game sessions lock the prize server-side; `POST /api/participants` never trusts client prize

## Prize inventory

| Prize | Max wins |
|-------|----------|
| Magnetic phone holder bottle | 33 |
| Leather magnetic card holder | 33 |
| Green Lion M4 phone & tablet holder | 34 |

Remaining slices: Better Luck Next Time (3), Try Again (2)
