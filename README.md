# Codeship

A full-stack competitive programming tracker that aggregates profiles from **Codeforces, LeetCode, CodeChef and GeeksforGeeks** into a unified dashboard. Built for IIT Jodhpur students to compare standings, track topic-wise progress and get AI-powered coaching.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM, NextAuth.js
- **Database**: PostgreSQL (Neon in prod, Docker locally), Upstash Redis
- **AI**: Google Gemini API (free tier) with Groq fallback
- **DevOps**: Vercel, GitHub Actions, Docker (local dev only)

## Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop

### Setup

```bash
git clone https://github.com/Vinamra3215/CodeShip.git
cd CodeShip
npm install

docker compose -f docker/docker-compose.yml up -d

cp .env.local.example .env.local

npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-char string for JWT signing |
| `NEXTAUTH_URL` | Base URL of the app |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GROQ_API_KEY` | Groq API key (AI fallback) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `CRON_SECRET` | Secret for protecting CRON endpoints |

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── lib/
│   ├── fetchers/     # Platform data fetchers (CF, LC, CC, GFG)
│   └── refresh/      # Staleness detection and sync engine
├── components/       # Reusable React components
└── types/            # Shared TypeScript types
prisma/               # Database schema and migrations
docker/               # Local dev Docker Compose config
```

## Roadmap

Built across 8 weeks — see [planning docs](https://github.com/Vinamra3215/temp-CodeShip) for the full day-wise schedule.
