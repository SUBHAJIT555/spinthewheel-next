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

## Prize inventory (max 2 each for testing)

| Prize | Max wins |
|-------|----------|
| Water Bottle | 2 |
| Leather MAG Card Holder | 2 |
| Phone Stand UGREEN | 2 |
| Laptop Stand UGREEN | 2 |
| A5 Agenda PU Leather | 2 |

Remaining slices: Better Luck Next Time
