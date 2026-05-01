# OpenFlow

OpenFlow es una consola de agentes inteligentes impulsada por IA. Conecta con tus herramientas favoritas y automatiza tu negocio a través de un chat conversacional potenciado por Omnia Gateway.

## Características

- **Chat inteligente** con soporte para markdown, imágenes y audio
- **Integraciones** con WooCommerce, WordPress y Evolution API (más próximamente)
- **Editor System Prompt** con formato markdown y toolbar
- **Gestión de suscripción** con planes y tokens
- **Autenticación** multi-usuario con registro y login
- **Modo oscuro/claro**
- **Descarga de historial** en JSON

## Tecnologías

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 4
- **UI:** Shadcn/ui, Lucide icons, Base UI
- **Markdown:** react-markdown, remark-gfm
- **Backend:** Omnia Gateway API (proxy via Next.js API routes)
- **Audio:** Web Speech API

## Requisitos

- Node.js 18+
- npm
- pm2 (para producción)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/openflow.git
cd openflow

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con:
# OMNIA_BASE_URL=http://217.216.43.75:9000
# NEXT_PUBLIC_OMNIA_BASE_URL=http://217.216.43.75:9000

# Iniciar en desarrollo
npm run dev

# O en producción con pm2
pm2 start npm --name openflow -- run dev -- --port 3001
```

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `OMNIA_BASE_URL` | URL base de la API de Omnia (server-side) |
| `NEXT_PUBLIC_OMNIA_BASE_URL` | URL base de la API de Omnia (client-side) |

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/login/         # Página de login/registro
│   ├── (main)/
│   │   ├── layout.tsx        # Layout principal con header y sidebars
│   │   └── chat/             # Página de chat
│   └── api/                  # API routes (proxy a Omnia)
├── components/
│   ├── ChatClient.tsx        # Lógica principal del chat
│   ├── AppSidebar.tsx        # Sidebar izquierdo (perfil, plan, API key)
│   ├── IntegrationsSidebar.tsx # Sidebar derecho (integraciones)
│   ├── MarkdownEditor.tsx    # Editor markdown con toolbar
│   ├── MarkdownRenderer.tsx  # Renderizador markdown centralizado
│   ├── UsageHeader.tsx       # Barra de uso de tokens en header
│   ├── chat/                 # Sub-componentes del chat
│   └── ui/                   # Componentes Shadcn/ui
└── lib/auth.ts               # Utilidades de autenticación
```

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/check-email` | POST | Verificar email existente |
| `/api/auth/login` | POST | Login o registro |
| `/api/chat` | POST | Enviar mensaje al agente |
| `/api/conversation` | GET/DELETE | Obtener/limpiar historial |
| `/api/profile` | GET/PUT | Obtener/actualizar perfil |
| `/api/profile/plan` | PUT | Cambiar plan |
| `/api/plans` | GET | Listar planes |
| `/api/integrations/woocommerce/test` | POST | Probar conexión WooCommerce |
| `/api/integrations/evolution/test` | POST | Probar conexión Evolution API |

## Licencia

MIT
