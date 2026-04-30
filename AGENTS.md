# Agent Guide - OpenFlow

## Tech Stack
- **Framework**: Next.js 15 (App Router, `src/` directory)
- **Styling**: Tailwind CSS 4 (CSS-first via `@import "tailwindcss"`, no `tailwind.config.js`)
- **AI**: `@assistant-ui/react` (`useLocalRuntime` pattern) + Vercel AI SDK
- **Markdown**: `react-markdown` + `remark-gfm` para renderizar mensajes
- **UI Components**: Shadcn/ui (neutral base, `base-nova` style, Lucide icons)
- **State**: Zustand
- **Dialog**: `@base-ui/react/dialog` primitives directly — do NOT use the shadcn dialog wrapper
- **External DB**: Omnia Gateway manages user data, plan, usage, and chat history

## Architecture

Single Next.js app, no monorepo. No local DB — Omnia Gateway handles all persistence.

| Directory | Purpose |
|---|---|
| `src/app/` | App Router pages, layouts, API routes, server actions |
| `src/app/(auth)/` | Auth pages (login) — no sidebar layout |
| `src/app/(main)/` | Main pages (chat) — with sidebar layout |
| `src/app/api/auth/` | Auth endpoints (login, check-email) |
| `src/app/api/chat/` | POST `/api/chat` — proxies to Omnia |
| `src/app/api/profile/` | GET+PUT `/api/profile` — proxies to Omnia |
| `src/app/api/plans/` | GET `/api/plans` — proxies to Omnia |
| `src/app/api/conversation/` | GET+DELETE `/api/conversation` — proxies to Omnia |
| `src/components/` | Business logic components |
| `src/components/ui/` | Shadcn/primitives |
| `src/lib/auth.ts` | Token utilities (getToken, saveToken, clearToken, isAuthenticated) |

### ChatClient (src/components/ChatClient.tsx)
- Custom implementation (no assistant-ui ThreadPrimitive due to API incompatibilities)
- Loads conversation from `GET /api/conversation` on mount
- Shows markdown content via `react-markdown` + `remark-gfm`
- Shows `thinking` field in blue box when present
- Shows `tool` role messages with orange styling
- Manual send via `POST /api/chat` — does NOT use runtime for sending

### AppSidebar (src/components/AppSidebar.tsx)
- Collapsible left sidebar with user info, plan display, plan change modal
- Shows API key (truncated), plan name, included tokens
- Logout button clears token and redirects to login
- Plan change modal via `@base-ui/react/dialog` primitives

### AuthChecker (src/components/AuthChecker.tsx)
- Client component that checks auth on every main layout render
- Redirects to `/login` if no token in localStorage

### External API (Omnia Gateway)
- **Not OpenAI-compatible** — no `choices`, no `model`, no `id` in responses
- Base: `http://217.216.43.75:9000`
- Auth: `Authorization: Bearer sk-omnia-...` header (all endpoints)
- **Client sends only the last user message** — backend manages full history in its DB
- API key stored in localStorage, sent in `Authorization` header on all requests
- Chat cold start ~30-60s on first request

## Authentication Flow

1. User visits `/` → client-side redirect to `/login` or `/chat` based on token
2. User enters email → `POST /api/auth/check-email` → shows "existing user" or "new user" form
3. New users select plan and enter name → `POST /api/auth/login` with `plan_id`
4. Login returns `{ id, name, email, api_key, ... }` → token saved to localStorage
5. All protected pages use `AuthChecker` client component to verify token exists

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/check-email` | Check if email exists (proxies to Omnia `/v1/check-email`) |
| POST | `/api/auth/login` | Login or register (proxies to Omnia `/v1/register`) |
| GET | `/api/plans` | Get all plans (proxies to Omnia `/v1/plans`) |
| GET | `/api/profile` | Get user profile (requires Bearer token) |
| PUT | `/api/profile` | Update profile (requires Bearer token) |
| PUT | `/api/profile/plan` | Change plan (requires Bearer token) |
| GET | `/api/conversation` | Get chat history (requires Bearer token) |
| DELETE | `/api/conversation` | Clear chat history (requires Bearer token) |
| POST | `/api/chat` | Send message (requires Bearer token) |

## Quirks & Gotchas
- **No local DB**: `src/db/` was removed. All user/chat data is in Omnia.
- **Tailwind 4**: No `tailwind.config.js`. Theme overrides in `src/app/globals.css`.
- **Dialog**: Always use `@base-ui/react/dialog` primitives, never shadcn wrapper.
- **Theme**: HTML has `className="dark"` for SSR. Toggle persists to `localStorage` key `theme`.
- **Imports**: `@/` alias maps to `src/`.
- **Apache proxy**: Dev server on port 3001, proxied at `openflow.test` via Apache with WebSocket support.
- **No test suite**: `npm test` does not exist.
- **Auth on server**: Never access localStorage or call auth functions in server components/layouts — use client-side `AuthChecker` component instead

## Developer Commands
- `npm run dev` — Dev server (port 3000 default; production uses 3001 via pm2)
- `npm run lint` — ESLint
- `npm run build` — Production build
- `pm2 restart openflow` — Restart production (picks up code changes)
- `rm -rf .next && pm2 restart openflow` — Clean cache + restart

### pm2 setup (production)
```
pm2 start npm --name openflow -- run dev -- --port 3001
```

## Test Accounts
- Email: `percyalvarez396@gmail.com`
- API key: `sk-omnia-KO2BZghwtpMqRCxJ-bZjidOOzusioUSiFW0eLYDqHh4`
- Plan IDs: 1=Gratis, 2=Básico, 3=Plus, 4=Premium