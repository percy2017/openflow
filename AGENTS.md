# Agent Guide - OpenFlow

## Tech Stack
- **Framework**: Next.js 15 (App Router, `src/` directory)
- **Styling**: Tailwind CSS 4 (CSS-first via `@import "tailwindcss"`, no `tailwind.config.js`)
- **AI**: `@assistant-ui/react` (`useLocalRuntime` pattern) + Vercel AI SDK
- **Markdown**: `react-markdown` + `remark-gfm` para renderizar mensajes
- **UI Components**: Shadcn/ui (neutral base, `base-nova` style, Lucide icons)
- **State**: Zustand
- **Dialog**: `@base-ui/react/dialog` primitives directly — do NOT use the shadcn dialog wrapper
- **Testing**: Playwright for E2E testing (browser automation)
- **External DB**: Omnia Gateway manages user data, plan, usage, and chat history

## Architecture

**Proyecto dividido en 2 partes:**
1. **Frontend (OpenFlow)** — Nuestro código en Next.js (localhost con Apache + pm2)
2. **Backend (Omnia API)** — Otro programador. API en VPS `http://217.216.43.75:9000`

**No guardamos nada localmente:**
- ❌ Sin DB local
- ❌ Sin historial guardado
- ❌ Sin procesamiento de imágenes
- ✅ Solo proxy hacia Omnia

| Directory | Purpose |
|---|---|
| `src/app/` | App Router pages, layouts, API routes, server actions |
| `src/app/(auth)/` | Auth pages (login, logout) — no sidebar layout |
| `src/app/(main)/` | Main pages (chat) — with sidebar layout |
| `src/app/api/` | Proxies requests to Omnia API |
| `src/components/` | Business logic components |
| `src/components/ui/` | Shadcn/primitives |
| `src/lib/auth.ts` | Token utilities |

## Environment Variables

```bash
# .env.local (NO commit to git, already in .gitignore)
OMNIA_BASE_URL=http://217.216.43.75:9000
NEXT_PUBLIC_OMNIA_BASE_URL=http://217.216.43.75:9000
```

Server-side API routes use:
```ts
const OMNIA_BASE = process.env.OMNIA_BASE_URL || "http://217.216.43.75:9000";
```

Client-side components use:
```ts
const OMNIA_BASE = process.env.NEXT_PUBLIC_OMNIA_BASE_URL || "http://217.216.43.75:9000";
```

## Omnia API (Backend - otro programador)

**Base URL:** `http://217.216.43.75:9000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/check-email` | Check if email exists |
| POST | `/v1/register` | Login or register |
| GET | `/v1/plans` | Get all plans |
| GET | `/v1/profile` | Get user profile (includes `created_at`) |
| PUT | `/v1/profile` | Update profile |
| PUT | `/v1/profile/plan` | Change plan |
| GET | `/v1/conversation` | Get chat history |
| DELETE | `/v1/conversation` | Clear chat history |
| POST | `/v1/chat/completions` | Send message with images |

**Auth:** `Authorization: Bearer sk-omnia-...` header on all requests

### Chat Response Format (from Omnia)
```json
{
  "message": {
    "role": "assistant",
    "content": "Response text",
    "thinking": "AI's reasoning...",
    "tool_calls": [...]
  },
  "files": [{"id": 1, "name": "file.jpg", "url": "...", "type": "image/jpeg"}],
  "history": [...],
  "usage": {
    "monthly_tokens": 78,
    "monthly_requests": 1,
    "tokens_remaining": 99922
  }
}
```

### Known Issues
- **GET /v1/conversation** — Returns `files` as string array (e.g., `["id=3 name='test.jpg' url='/uploads/...' type='image/jpeg'"]`)
  - **Status:** Fixed by Omnia developer — frontend parses the string format
  - Images load correctly from Omnia's `/uploads/` path

## Testing (Playwright)
- E2E tests can use Playwright to automate browser testing
- Example test structure:
```ts
import { test, expect } from '@playwright/test';
test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[type="email"]', 'user@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/chat');
});
```
- Run tests: `npx playwright test`
- Install browsers: `npx playwright install chromium`

## Authentication Flow

1. User visits `/` → client-side redirect to `/login` or `/chat` based on token
2. User enters email → `POST /api/auth/check-email` → shows "existing user" or "new user" form
3. Existing users see "Bienvenido de nuevo [name]" with Enter button
4. New users enter name and select plan → `POST /api/auth/login` with `plan_id`
5. Login returns `{ id, name, email, api_key, ... }` → token saved to localStorage
6. All protected pages use `AuthChecker` client component to verify token exists

### Chat with Images Flow
```
[User pastes/selects image]
        ↓
[Preview thumbnail in footer]
        ↓
[User writes optional text]
        ↓
[Send] → POST /api/chat with:
{
  "messages": [{
    "role": "user",
    "content": "optional text",
    "files": [{
      "name": "image.jpg",
      "data": "base64...without prefix",
      "type": "image/jpeg"
    }]
  }]
}
```

## Frontend Components

### ChatClient (src/components/ChatClient.tsx)
- Custom implementation (no assistant-ui ThreadPrimitive due to API incompatibilities)
- Loads conversation from `GET /api/conversation` on mount
- Shows markdown content via `react-markdown` + `remark-gfm`
- Shows `thinking` field in blue box as **separate block**
- Shows `tool` role messages with orange styling as **separate block**
- **Collapse/expand** buttons (▾/▸) on thinking and tool blocks
- **Image upload**: Button 📎 to select images, Ctrl+V to paste
- Images converted to base64 and sent in `files` array
- Footer shows response time, tokens remaining, audio button
- Audio: Web Speech API with Spanish voice selection (excludes "whisper" voices)
- Manual send via `POST /api/chat` — does NOT use runtime for sending

### Message Roles
- `user` — Blue bubble, right-aligned, may contain image thumbnails
- `assistant` — Gray bubble, left-aligned, with footer (time, tokens, audio)
- `tool` — Orange bubble, collapsible, shows tool name and arguments
- `thinking` — Blue-tinted box, collapsible, shows AI's internal reasoning

### AppSidebar (src/components/AppSidebar.tsx)
- Collapsible left sidebar with user info, plan display, usage stats
- Shows API key (clickable to copy, fallback for no clipboard API)
- Shows `created_at` as "Desde: fecha" subscription date
- Plan name, included tokens, usage statistics
- Logout button clears token and redirects to login
- Plan change modal via `@base-ui/react/dialog` primitives
- System prompt editor (saved to localStorage)
- Clear history button with **confirmation dialog** before DELETE
- Uses `ProfileContext.clearMessages()` to clear chat UI

### ProfileContext (src/components/ProfileContext.tsx)
- React Context for sharing profile AND messages between ChatClient and AppSidebar
- `setProfile()` — set profile data
- `updateTokens()` — update tokens without full reload
- `messages` / `setMessages` — shared chat messages state (single source of truth)
- `clearMessages()` — clears both context and all chat UI

### AuthChecker (src/components/AuthChecker.tsx)
- Client component that checks auth on every main layout render
- Redirects to `/login` if no token in localStorage
- Also handles 401/403 from API calls and redirects to login

## Features Implemented

### Image Upload
- Button 📎 to select from PC
- Ctrl+V to paste from clipboard
- Preview thumbnails with X to remove
- Max 5MB, only jpg/png/gif/webp
- Converted to base64 (data without prefix)
- Sent in `files` array with message
- **History:** Images load from Omnia's `/uploads/` path (URLs parsed from string format)

### Audio Playback (TTS)
- Web Speech API (browser native)
- Spanish voices, excludes "whisper" voices
- Click 🔊 to speak message content
- Click again to stop
- Cleans markdown formatting before speaking

### Response Footer
- Response time: `2.3s`
- Tokens remaining from profile API
- Audio button

### Token Auto-Update
- After each message, ChatClient fetches `/api/profile`
- Updates AppSidebar via ProfileContext
- No page reload needed

### Error Handling
- 401/403 → clear token + redirect to `/login`
- API errors → show in UI
- Image validation → toast errors

## Quirks & Gotchas
- **No local DB**: `src/db/` was removed. All user/chat data is in Omnia.
- **Tailwind 4**: No `tailwind.config.js`. Theme overrides in `src/app/globals.css`.
- **Dialog**: Always use `@base-ui/react/dialog` primitives, never shadcn wrapper.
- **Theme**: HTML has `className="dark"` for SSR. Toggle persists to `localStorage` key `theme`.
- **Imports**: `@/` alias maps to `src/`.
- **Apache proxy**: Dev server on port 3001, proxied at `openflow.test` via Apache with WebSocket support.
- **Auth on server**: Never access localStorage or call auth functions in server components/layouts — use client-side `AuthChecker` component instead
- **Audio**: Depends on browser/system voices. Firefox on Linux uses speech-dispatcher voices (can be robotic). Exclude "whisper" voices for better quality.
- **API Key display**: Click to select all, Ctrl+C to copy. Fallback text selection for browsers without clipboard API.
- **Images in history**: `files` field comes as string format `["id=3 name='file.jpg' url='/uploads/...' type='image/jpeg'"]` - frontend parses to object with name/url/type

## Developer Commands
- `npm run dev` — Dev server (port 3000 default; production uses 3001 via pm2)
- `npm run lint` — ESLint
- `npm run build` — Production build
- `pm2 restart openflow` — Restart production (picks up code changes)
- `rm -rf .next && pm2 restart openflow` — Clean cache + restart

### Environment
- **Local frontend:** Next.js via pm2 on port 3001
- **Omnia API:** VPS at `http://217.216.43.75:9000`
- **Proxy:** Apache configured for `openflow.test`

### pm2 setup (production)
```
pm2 start npm --name openflow -- run dev -- --port 3001
```

## File Structure (key files)
```
src/
├── app/
│   ├── (auth)/login/page.tsx     # Login/registration page
│   ├── (main)/
│   │   ├── layout.tsx             # Main layout with sidebar
│   │   └── chat/page.tsx          # Chat page
│   └── api/
│       ├── auth/login/route.ts
│       ├── auth/check-email/route.ts
│       ├── chat/route.ts
│       ├── conversation/route.ts
│       ├── profile/route.ts
│       ├── profile/plan/route.ts
│       └── plans/route.ts
├── components/
│   ├── ChatClient.tsx            # Main chat UI with images/audio
│   ├── AppSidebar.tsx            # Sidebar with profile/usage/API key
│   ├── AuthChecker.tsx           # Auth redirect component
│   ├── ProfileContext.tsx        # Context for tokens AND messages
│   └── ui/                       # Shadcn components
└── lib/auth.ts                   # Token utilities

.env.local                       # OMNIA_BASE_URL (not in git)
```