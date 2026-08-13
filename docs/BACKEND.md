# Backend setup (Supabase + Vercel)

## 1. Supabase

1. Create a Supabase project.
2. Open **SQL Editor** and run [`sql/schema.sql`](./sql/schema.sql).
3. Project Settings → Database → copy connection strings:
   - **Transaction / pooled** → `DATABASE_URL` (use this on Vercel)
   - **Direct** → `DIRECT_URL` (optional; useful for migrations)

Prefer the pooler URL (port `6543`, `?pgbouncer=true`) for serverless.

## 2. Local env

Copy `.env.example` to `.env.local`:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

Never commit `.env.local`.

## 3. Vercel

Project → Settings → Environment Variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase pooled connection string |
| `DIRECT_URL` | Supabase direct connection string (optional) |

Redeploy after saving.

## 4. Flow

```text
SPIN → POST /api/game-sessions
     → wheel lands
     → POST /api/game-sessions/claim { gameSessionId, prize }
     → form (name + contact)
     → POST /api/participants { name, contactNumber, gameSessionId }
     → server loads prize from game_sessions
     → INSERT participants
```

Prize in the participant row always comes from `game_sessions.prize`, never from the submit body.
