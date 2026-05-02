# OpenFlow — Agent Guide

## Stack
- **Next.js 15** App Router (`src/` dir), React 19, TypeScript 5, strict mode
- **Tailwind CSS 4** (CSS-first, **no** `tailwind.config.js` — overrides in `src/app/globals.css`)
- **shadcn/ui** `base-nova` style, Lucide icons, `@/` → `src/`
- **`@base-ui/react/dialog`** primitives for all dialogs (NOT shadcn dialog wrapper)
- **`@assistant-ui/react`** + Vercel AI SDK for chat UI
- **pm2** for production process management

## Architecture
- **No local DB.** All data (users, plans, chat history) lives in **Omnia API** at `http://217.216.43.75:9000`
- Frontend is a proxy-only layer. Auth via `Authorization: Bearer sk-omnia-...` from localStorage.
- Chat sends current message + integrations — Omnia manages history server-side.
- **After each chat message, the frontend refetches `GET /v1/conversation`** to rebuild the full message list (does NOT rely on `data.history` from the chat response).
- Server routes use `OMNIA_BASE_URL`, client uses `NEXT_PUBLIC_OMNIA_BASE_URL` (both in `.env.local`, gitignored)
- Integrations are stored entirely in **localStorage** (key: `integrations`), never in Omnia.
- Production runs via **pm2** on port 3000 (config: `ecosystem.config.cjs`).

## Critical Conventions
- **Dialogs**: Always `@base-ui/react/dialog` primitives, never shadcn dialog
- **Auth in server components**: Never access localStorage. Use `AuthChecker` client component instead.
- **localStorage keys**: `api_key`, `systemPrompt`, `integrations`, `theme`
- **Integrations localStorage format**:
  ```json
  {
    "enabled": ["woocommerce", "evolution", "chatwoot"],
    "woocommerce": { "siteUrl": "...", "consumerKey": "...", "consumerSecret": "..." },
    "evolution": { "url": "...", "token": "..." },
    "chatwoot": { "baseUrl": "...", "token": "...", "accountId": "..." }
  }
  ```
- **Tailwind 4**: No `tailwind.config.js`. CSS is applied via `@import "tailwindcss"` in globals.css.

## Integrations
Each integration has:
1. **Config type** in `src/components/IntegrationsSidebar.tsx`
2. **Test endpoint** at `src/app/api/integrations/<name>/test/route.ts`
3. **Connect/disconnect handlers** + UI card in `IntegrationsSidebar.tsx`
4. **Chat integration** — enabled integrations are sent to Omnia inside `body.integrations` as opaque key-value pairs (see `docs/integrations-json-format.md`)

### Current integrations
| Integration | Config key | Fields | Icon |
|-------------|-----------|--------|------|
| WooCommerce | `woocommerce` | `siteUrl`, `consumerKey`, `consumerSecret` | Globe (blue) |
| Evolution API | `evolution` | `url`, `token` | Server (purple) |
| Chatwoot | `chatwoot` | `baseUrl`, `token`, `accountId` | MessageCircle (cyan) |

## Omnia API quirks
- `GET /v1/conversation` returns `files` as string array `["id=3 name='file.jpg' url='/uploads/...' type='image/jpeg'"]` — frontend parses it with regex (`name='...'`, `url='...'`, `type='...'`)
- `tool_calls` + `thinking` arrive inside the **same** assistant message — frontend splits them into individual 🔧/💭/assistant blocks
- **Multiple tool_calls** in one assistant message each become their own individual `ToolBubble` (one per tool call)
- Chat history is always fetched via `GET /v1/conversation` — the frontend does NOT parse `data.history` from the chat response

## Commands
```bash
npm run dev      # dev server (port 3000)
npm run build    # production build
npm run start    # start production
npm run lint     # ESLint 9 flat config
pm2 start ecosystem.config.cjs    # start via pm2 (port 3000)
pm2 restart openflow              # restart
pm2 stop openflow                 # stop
pm2 logs openflow                 # view logs
```

## Notable
- Dev origins: `allowedDevOrigins: ["openflow.test"]` in `next.config.ts`
- No test suite configured
- Images: max 5MB, jpg/png/gif/webp only, sent as base64 (no prefix) in `files` array
- Production via **pm2** on port 3000 (no Apache proxy)
- Integration JSON formats documented in `docs/integrations-json-format.md`
- Ecosystem config for pm2: `ecosystem.config.cjs`
