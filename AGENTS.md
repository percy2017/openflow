# Agent Guide - OpenFlow

## Tech Stack
- **Framework**: Next.js 15 (App Router, `src/` directory)
- **Styling**: Tailwind CSS 4 (CSS-first via `@import "tailwindcss"`, no `tailwind.config.js`)
- **AI**: `@assistant-ui/react` (`useLocalRuntime` pattern) + Vercel AI SDK
- **Markdown**: `react-markdown` + `remark-gfm` para renderizar mensajes
- **UI Components**: Shadcn/ui (neutral base, `base-nova` style, Lucide icons)
- **Dialog**: `@base-ui/react/dialog` primitives directly — do NOT use the shadcn dialog wrapper
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
| `src/components/chat/` | Chat sub-components (MessageBubble, ChatInput, types) |
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

### Chat Request Format (to Omnia)

El frontend envía solo el mensaje actual + system prompt. **No envía el historial completo** — Omnia lo gestiona server-side.

```json
POST /v1/chat/completions
{
  "messages": [
    { "role": "system", "content": "Eres un asistente..." },    // opcional, desde localStorage
    { "role": "user", "content": "mensaje del usuario",         // actual input
      "files": [{ "name": "image.jpg", "data": "base64...", "type": "image/jpeg" }]   // opcional
    }
  ],
  "integrations": {                                             // opcional, desde localStorage
    "woocommerce": {
      "siteUrl": "https://mitienda.com",
      "consumerKey": "ck_xxx",
      "consumerSecret": "cs_xxx"
    }
  }
}
```

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
  "history": [
    { "role": "assistant", "content": "", "thinking": "...", "tool_calls": [...], "created_at": "..." },   // thinking + tool_calls dentro del mismo assistant
    { "role": "tool", "content": "...", "tool_name": "webfetch", "created_at": "..." },
    { "role": "assistant", "content": "Respuesta final", "thinking": "...", "tokens": 8440, "created_at": "..." }
  ],
  "usage": {
    "monthly_tokens": 78,
    "monthly_requests": 1,
    "tokens_remaining": 99922
  }
}
```

### GET /v1/conversation Response Format
```json
{
  "messages": [
    { "role": "user", "content": "mensaje", "created_at": "..." },
    { "role": "assistant", "content": "", "thinking": "...", "tool_calls": [...], "created_at": "..." },
    { "role": "tool", "content": "...", "tool_name": "webfetch", "created_at": "..." },
    { "role": "assistant", "content": "Respuesta final", "thinking": "...", "tokens": 8440, "created_at": "..." }
  ]
}
```

### Known Issues
- **GET /v1/conversation** — Returns `files` as string array (e.g., `["id=3 name='test.jpg' url='/uploads/...' type='image/jpeg'"]`)
  - **Status:** Fixed by Omnia developer — frontend parses the string format
  - Images load correctly from Omnia's `/uploads/` path

## Integrations (Integraciones)

Las integraciones permiten que el agente de IA se conecte a servicios externos (WooCommerce, etc.).

### Arquitectura

```
[Frontend] localStorage → POST /api/chat + integrations → [Proxy] → POST /v1/chat/completions + integrations → [Omnia API]
                                                                                                                          ↓
                                                                                                             Omnia ejecuta el "skill"
                                                                                                             (cómo conectarse, qué endpoints llamar)
                                                                                                             contra la API externa
                                                                                                                          ↓
[Frontend] ←────────────── JSON response ←──────────────────────────────────────────────────────────── [Omnia API] responde al usuario
```

**Regla fundamental:** El "skill" (conocimiento de cómo conectarse y qué hacer) lo tiene **Omnia server-side**. El frontend solo:
1. Guarda las credenciales de conexión
2. Las envía a Omnia en cada request de chat
3. Omnia ejecuta la integración y devuelve la respuesta al usuario

### Dónde se guardan

| Dato | Dónde | Key |
|------|-------|-----|
| Token API | `localStorage` | `"api_key"` |
| System prompt | `localStorage` | `"systemPrompt"` |
| Credenciales de integraciones | `localStorage` | `"integrations"` |
| Tema | `localStorage` | `"theme"` |

Las credenciales se guardan en `localStorage` con formato:
```json
{
  "enabled": ["woocommerce"],
  "woocommerce": {
    "siteUrl": "https://mitienda.com",
    "consumerKey": "ck_xxxxxxxxx",
    "consumerSecret": "cs_xxxxxxxxx"
  }
}
```

- `enabled`: array con las keys de integraciones activas (toggle on)
- Cada integración tiene su propio objeto con credenciales
- Solo las integraciones en `enabled` se envían a Omnia en cada request

### Flujo de integración (WooCommerce ejemplo)

1. **Usuario configura integración** en sidebar derecho (🔌)
   - Ingresa: Site URL, Consumer Key, Consumer Secret
   - Se prueba la conexión contra `GET /wp-json/wc/v3/system_status`
   - Se guarda en `localStorage` key `"integrations"`
2. **Usuario envía un mensaje** relacionado (ej: "Cuántos pedidos tengo?")
3. **ChatClient** lee `localStorage.getItem("integrations")` y lo incluye en el body:
```json
POST /api/chat
{
  "messages": [
    { "role": "user", "content": "¿Cuántos pedidos tengo pendientes?" }
  ],
  "integrations": {
    "woocommerce": {
      "siteUrl": "https://mitienda.com",
      "consumerKey": "ck_xxx",
      "consumerSecret": "cs_xxx"
    }
  }
}
```
4. **Proxy** `/api/chat/route.ts` forwardea `{ messages, integrations }` a Omnia
5. **Omnia** recibe las credenciales, ejecuta la API de WooCommerce (sabe cómo hacerlo = el skill), y responde:
   - "Tienes 3 pedidos pendientes por $450"
6. **Frontend** muestra la respuesta

### API Routes

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/chat` | Proxy a Omnia para chat + integraciones |
| `POST /api/integrations/woocommerce/test` | Prueba conexión contra WooCommerce |
| `POST /api/integrations/evolution/test` | Prueba conexión contra Evolution API |

### IntegrationsSidebar (src/components/IntegrationsSidebar.tsx)

- Sidebar derecho con botón toggle en header (icono 🔌)
- Cada integración es una card independiente con:
  - **Toggle switch** (icono ToggleLeft/ToggleRight) para activar/desactivar
  - Campos de configuración según la integración
  - Botón "Conectar" → prueba conexión → guarda en localStorage
  - Badge verde "Conectado" cuando hay credenciales
  - Botón "Desconectar" elimina las credenciales
- Solo las integraciones con toggle activo se envían a Omnia en cada request
- Placeholder para futuras integraciones
- System Prompt editor con MarkdownEditor (toolbar con formato markdown + vista previa)

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
{ "messages": [{
    "role": "user",
    "content": "optional text",
    "files": [{ "name": "image.jpg", "data": "base64...", "type": "image/jpeg" }]
  }]
}
```

## Frontend Components

### ChatClient (src/components/ChatClient.tsx)
- Custom implementation (no assistant-ui ThreadPrimitive due to API incompatibilities)
- Loads conversation from `GET /api/conversation` on mount
- Shows markdown content via `MarkdownRenderer` (links open in new tab)
- Shows `thinking` (💭) and `tool` (🔧) blocks in chat
- **Collapse/expand** buttons (▾/▸) on thinking and tool blocks
- **Image upload**: Button 📎 to select images, Ctrl+V to paste
- Footer shows cronometer time + tokens remaining + audio button
- Audio: Web Speech API with Spanish voice (rate 1.1, pitch 0.9)
- Processing indicator with animated spinner and cronometer
- Manual send via `POST /api/chat` — does NOT use runtime for sending
- Empty state with quick prompt buttons (general + integration-specific)

### Sub-components (src/components/chat/)

| Component | File | Description |
|---|---|---|
| `MessageBubble` | `MessageBubble.tsx` | 4 role-specific message renders (tool, user, thinking, assistant) |
| `ChatInput` | `ChatInput.tsx` | Textarea + image attach + send button |
| `types` | `types.ts` | Message, AttachedFile type definitions |

### Layout (src/app/(main)/layout.tsx)
- **Header**: SidebarTrigger → UsageHeader (token bar) → action buttons
- **Header actions**: 🗑 (clear chat) → ⬇ (download JSON) → 🌙 (theme toggle) → 🔌 (integrations) → 🚪 (logout)
- All destructive actions have confirmation dialogs using `@base-ui/react/dialog`
- Download button fetches conversation as `chat-YYYY-MM-DD.json`

### UsageHeader (src/components/UsageHeader.tsx)
- Token usage bar with used/total and remaining count
- Replaces the old "OpenFlow AI" text in header
- Connected from layout via ProfileProvider

### MarkdownRenderer (src/components/MarkdownRenderer.tsx)
- Centralized markdown renderer with `react-markdown` + `remark-gfm`
- All links (`<a>`) open in `target="_blank" rel="noopener noreferrer"`
- Used by both MessageBubble and MarkdownEditor preview

### MarkdownEditor (src/components/MarkdownEditor.tsx)
- Rich markdown editing toolbar: **B I H ≡ 1. `</>` 🔗**
- Toggle between edit mode and preview mode
- Used for System Prompt editing in IntegrationsSidebar

### AppSidebar (src/components/AppSidebar.tsx)
- Left sidebar with user info (name, email, phone, created_at, API key)
- No Card wrapper or avatar — clean text layout
- Plan badge + upgrade card
- API Key shown truncated with copy button
- Edit profile modal with validation (name required, email format) and confirmation dialog
- Plan change modal via `@base-ui/react/dialog` primitives
- "Acerca de nosotros" dialog in footer
- Logout clears `api_key`, `systemPrompt`, `integrations` from localStorage

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
- Rate 1.1, pitch 0.9 for natural sound
- Click 🔊 to speak message content
- Click again to stop
- Cleans markdown formatting before speaking

### Response Footer
- Cronometer time from processing indicator
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
- Chat errors display in the chat as assistant messages

### Empty State
- Logo + "OpenFlow Agents" title
- Quick prompts: general (3) and integration-specific (2 per active integration)
- Styled with rounded-xl, hover effects

## Quirks & Gotchas
- **No local DB**: All user/chat data is in Omnia.
- **Tailwind 4**: No `tailwind.config.js`. Theme overrides in `src/app/globals.css`.
- **Dialog**: Always use `@base-ui/react/dialog` primitives, never shadcn wrapper.
- **Theme**: HTML has `className="dark"` for SSR. Toggle persists to `localStorage` key `theme`.
- **Imports**: `@/` alias maps to `src/`.
- **Apache proxy**: Dev server on port 3001, proxied at `openflow.test` via Apache with WebSocket support.
- **Auth on server**: Never access localStorage or call auth functions in server components/layouts — use client-side `AuthChecker` component instead
- **Audio**: Depends on browser/system voices. Firefox on Linux uses speech-dispatcher voices (can be robotic). Exclude "whisper" voices for better quality.
- **API Key display**: Click to select all, Ctrl+C to copy. Fallback text selection for browsers without clipboard API.
- **Images in history**: `files` field comes as string format `["id=3 name='file.jpg' url='/uploads/...' type='image/jpeg'"]` - frontend parses to object with name/url/type
- **Omnia history format**: `tool_calls` + `thinking` dentro del mismo `assistant` message. El frontend los separa en bloques tool (🔧) y thinking (💭).

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
│   ├── (auth)/login/page.tsx           # Login/registration page
│   ├── (main)/
│   │   ├── layout.tsx                   # Main layout with header + sidebars
│   │   └── chat/page.tsx                # Chat page
│   └── api/
│       ├── auth/login/route.ts
│       ├── auth/check-email/route.ts
│       ├── chat/route.ts                # Proxy to Omnia + integrations
│       ├── conversation/route.ts
│       ├── profile/route.ts
│       ├── profile/plan/route.ts
│       ├── plans/route.ts
│       └── integrations/
│           ├── woocommerce/test/route.ts
│           └── evolution/test/route.ts
├── components/
│   ├── ChatClient.tsx                   # Main chat logic
│   ├── AppSidebar.tsx                   # Left sidebar (profile, plan, API key)
│   ├── IntegrationsSidebar.tsx          # Right sidebar (integrations + system prompt)
│   ├── AuthChecker.tsx                  # Auth redirect guard
│   ├── ProfileContext.tsx               # Shared state context
│   ├── MarkdownEditor.tsx               # Rich markdown editor toolbar
│   ├── MarkdownRenderer.tsx             # Centralized markdown renderer
│   ├── UsageHeader.tsx                  # Token usage bar in header
│   ├── ThemeToggle.tsx                  # Dark/light toggle
│   ├── theme-provider.tsx               # Theme context provider
│   ├── chat/
│   │   ├── MessageBubble.tsx            # 4 message role renders
│   │   ├── ChatInput.tsx                # Input + file attach
│   │   └── types.ts                     # Shared types
│   └── ui/                              # Shadcn components
└── lib/auth.ts                          # Token utilities

.env.local                               # OMNIA_BASE_URL (not in git)
```
