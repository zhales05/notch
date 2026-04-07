# Plan: Notch MCP Server with OAuth + Streamable HTTP

## Context

The Notch app is a habit tracker built with Next.js + Supabase (no custom API layer — all data access is direct Supabase client calls with RLS). The goal is to expose the backend as an MCP server so AI clients (Claude Desktop, etc.) can read/write habit data on behalf of authenticated users. The user wants **OAuth authentication** (multi-user, delegating to Supabase Auth) and **Streamable HTTP transport** (network-accessible, not just stdio).

---

## Architecture

```
MCP Client (Claude Desktop, etc.)
    │
    ├── OAuth flow → /authorize (login form) → Supabase Auth → /token
    │
    └── MCP over HTTP → POST /mcp (Bearer token)
            │
            ├── Auth middleware: look up session → create Supabase client with user's JWT
            │
            └── Tool handlers → Supabase queries (RLS enforced per user)
```

**Key decision: Opaque tokens backed by server-side sessions.** We don't pass raw Supabase JWTs to MCP clients because they expire hourly and Supabase refresh tokens don't match the OAuth refresh_token grant MCP clients expect. Instead, the MCP server stores Supabase sessions in an `mcp_sessions` table and issues its own opaque tokens. It transparently refreshes the underlying Supabase session when needed.

---

## New directory: `notch-mcp/`

```
notch-mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts                  # Hono app + listen on port 3001
│   ├── mcp-server.ts             # McpServer definition + tool registration
│   ├── auth/
│   │   ├── metadata.ts           # GET /.well-known/oauth-authorization-server
│   │   ├── authorize.ts          # GET/POST /authorize (login form + Supabase signIn)
│   │   ├── callback.ts           # GET /callback (magic link redirect handler)
│   │   ├── token.ts              # POST /token (code exchange + refresh grant)
│   │   ├── middleware.ts         # Bearer token → Supabase client per request
│   │   ├── session-store.ts      # CRUD on mcp_sessions table (service-role)
│   │   └── pkce.ts               # SHA256 code_challenge verification
│   ├── tools/
│   │   ├── list-habits.ts
│   │   ├── get-habit.ts
│   │   ├── log-habit.ts
│   │   ├── list-goals.ts
│   │   ├── get-goal.ts
│   │   ├── list-categories.ts
│   │   └── get-today-summary.ts
│   └── lib/
│       ├── supabase.ts           # createServiceClient() + createUserClient(token)
│       ├── date-utils.ts         # Copied from notch-web (pure functions, no React)
│       ├── frequency-utils.ts    # Copied from notch-web (pure functions, no React)
│       └── types.ts              # Data types copied from notch-web/src/lib/types/
```

---

## Implementation Steps

### Step 1: Project scaffolding

Create `notch-mcp/` with:
- **package.json**: deps = `@modelcontextprotocol/sdk`, `hono`, `@hono/node-server`, `@supabase/supabase-js`, `zod`; devDeps = `typescript`, `tsx`, `@types/node`
- **tsconfig.json**: target ES2022, module NodeNext, strict
- **.env.example**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MCP_SERVER_URL` (default http://localhost:3001), `MCP_SERVER_PORT` (default 3001)

### Step 2: Supabase migrations

**Migration 1** — `mcp_sessions` table (accessed only via service-role, no RLS policies):
- `id` uuid PK
- `user_id` uuid FK → profiles
- `access_token`, `refresh_token` (Supabase tokens)
- `mcp_token`, `mcp_refresh` (opaque tokens for MCP clients)
- `code` (temporary auth code, nulled after exchange)
- `code_challenge`, `code_method`, `redirect_uri` (PKCE + OAuth state)
- `expires_at` timestamptz
- Indexes on `mcp_token`, `code`, `user_id`

**Migration 2** — Add `'mcp'` to `log_source` enum:
```sql
ALTER TYPE public.log_source ADD VALUE 'mcp';
```

### Step 3: Shared library code

Copy pure utility files from `notch-web/src/lib/` into `notch-mcp/src/lib/`:
- `date-utils.ts` — formatDateKey, getWeekStart, getMonthStart, parseDateKey (no browser deps)
- `frequency-utils.ts` — isHabitDueOnDate, getFrequencyLabel (update imports to local paths)
- `types.ts` — data interfaces: Habit, HabitWithCategory, Category, HabitLog, Goal, GoalWithCategory, GoalProgress, FrequencyType, LogType, etc.

Create `lib/supabase.ts`:
- `createServiceClient()` — uses `SUPABASE_SERVICE_ROLE_KEY` (for mcp_sessions access)
- `createUserClient(accessToken)` — uses anon key + sets Authorization header (for RLS queries)

### Step 4: OAuth endpoints

**4a. OAuth metadata** — `GET /.well-known/oauth-authorization-server`
Returns RFC 8414 JSON: issuer, authorization_endpoint, token_endpoint, supported types/grants/PKCE methods.

**4b. Authorization** — `GET /authorize` + `POST /authorize`
- GET: Serve a minimal HTML login form (email + password + magic link). Hidden fields carry `state`, `code_challenge`, `code_challenge_method`, `redirect_uri` from query params.
- POST: Call `supabase.auth.signInWithPassword()`. On success, generate a random auth `code`, store a pending session in `mcp_sessions`, redirect to the client's `redirect_uri?code=...&state=...`.
- Magic link variant: POST to `/authorize/magic-link` sends OTP, callback at `/callback` completes the flow.

**4c. Token endpoint** — `POST /token`
- `grant_type=authorization_code`: Look up session by `code`, verify PKCE (SHA256 code_verifier vs stored code_challenge), generate `mcp_token` + `mcp_refresh`, return them.
- `grant_type=refresh_token`: Look up session by `mcp_refresh`, refresh the underlying Supabase session, rotate `mcp_token`, return new tokens.

**4d. PKCE utils** — `verifyCodeChallenge(verifier, challenge)`: base64url(sha256(verifier)) === challenge

**4e. Session store** — CRUD functions on `mcp_sessions` using service-role client.

### Step 5: Auth middleware

Hono middleware for `/mcp` route:
1. Extract `Authorization: Bearer <mcp_token>`
2. Look up session in `mcp_sessions`
3. If Supabase token expired, transparently refresh it
4. Create `userClient = createUserClient(session.access_token)`
5. Attach to Hono context: `c.set('supabase', userClient)`, `c.set('userId', session.user_id)`

### Step 6: MCP server + Streamable HTTP transport

**6a. MCP server** — Create `McpServer` from `@modelcontextprotocol/sdk`, register all 7 tools.

**6b. Transport wiring** — Hono routes:
- `POST /mcp` — Create `StreamableHTTPServerTransport` (stateless mode), connect to MCP server, pipe request/response
- `GET /mcp` — SSE endpoint for streaming responses
- `DELETE /mcp` — Session termination

### Step 7: MCP tools

All tools receive the authenticated Supabase client from context. Zod schemas for input validation.

| Tool | Params | Query pattern (from existing hooks) |
|------|--------|-------------------------------------|
| `list_habits` | `category_id?`, `archived?`, `frequency?` | `use-habits.ts` — select *, categories join, filter archived_at |
| `get_habit` | `id` | Single row + category join |
| `log_habit` | `habit_id`, `date?`, `value?` | `use-logs.ts` — upsert with onConflict, source='mcp' |
| `list_goals` | `status?` | `use-goals.ts` — select + category join + RPC progress |
| `get_goal` | `id` | `use-goals.ts` fetchGoalDetail — goal + goal_habits + progress |
| `list_categories` | `include_archived?` | `use-categories.ts` — select, filter archived_at |
| `get_today_summary` | `date?` | `use-today-habits.ts` — habits + logs + frequency filtering + period counts |

### Step 8: Entry point

`src/index.ts`: Create Hono app, mount OAuth routes (public), mount `/mcp` with auth middleware, start server on configured port.

---

## Key files to reference during implementation

| Purpose | File |
|---------|------|
| Supabase client pattern | `notch-web/src/lib/supabase/client.ts` |
| Habit queries | `notch-web/src/hooks/use-habits.ts` |
| Log upsert pattern | `notch-web/src/hooks/use-logs.ts` |
| Today summary logic | `notch-web/src/hooks/use-today-habits.ts` |
| Goal detail + progress | `notch-web/src/hooks/use-goals.ts` |
| Category queries | `notch-web/src/hooks/use-categories.ts` |
| Frequency utils (copy) | `notch-web/src/lib/frequency-utils.ts` |
| Date utils (copy) | `notch-web/src/lib/date-utils.ts` |
| Type definitions | `notch-web/src/lib/types/*.ts` |
| DB schema | `supabase/migrations/` |

---

## Verification

1. **Start Supabase locally** — `supabase start` (runs migrations including new mcp_sessions table)
2. **Start MCP server** — `cd notch-mcp && npm run dev` (should listen on port 3001)
3. **Test OAuth flow manually**:
   - `GET http://localhost:3001/.well-known/oauth-authorization-server` — should return metadata JSON
   - `GET http://localhost:3001/authorize?response_type=code&client_id=test&redirect_uri=http://localhost:8080/callback&code_challenge=...&code_challenge_method=S256&state=abc` — should show login form
   - Submit login with seed user (`user_a@test.com` / `password123`) — should redirect with auth code
   - `POST /token` with code + code_verifier — should return access/refresh tokens
4. **Test MCP tools** — Use `curl` or the MCP Inspector:
   - `POST /mcp` with Bearer token, JSON-RPC call to `list_categories` — should return user's categories
   - `list_habits` — should return habits with categories
   - `log_habit` — should create a log entry
   - `get_today_summary` — should return today's habits with completion status
5. **Test with Claude Desktop** — Add the server URL to MCP config, go through OAuth, verify tools appear and work
