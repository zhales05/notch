# Notch

Habit tracking, simplified.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.17+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)

## Getting Started

### 1. Install dependencies

```bash
cd notch-web
npm install
```

### 2. Set up environment variables

```bash
cp notch-web/.env.local.example notch-web/.env.local
```

### 3. Start Supabase (requires Docker running)

```bash
npx supabase start
```

This starts the local Supabase stack (Postgres, Auth, Storage, etc.) via Docker. On first run it will pull images which takes a few minutes.

Once started, it prints your local API URL and keys. These are already configured in `.env.local` if you used the example file.

### 4. Start the web app

In a separate terminal:

```bash
cd notch-web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Notch landing page with a green Supabase connection indicator.

### Stopping

- **Next.js**: `Ctrl+C` in the terminal
- **Supabase**: `npx supabase stop` (from repo root)

Supabase data persists between restarts.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Storage)
- **State**: Zustand
- **Charts**: Recharts
