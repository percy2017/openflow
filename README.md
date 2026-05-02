# OpenFlow

OpenFlow es una consola de agentes inteligentes impulsada por IA. Conecta con tus herramientas favoritas (WooCommerce, Evolution API, Chatwoot) y automatiza tu negocio a través de un chat conversacional potenciado por Omnia Gateway.

## Características

- **Chat inteligente** con soporte para markdown, imágenes y TTS
- **Integraciones** con WooCommerce, Evolution API y Chatwoot
- **System Prompt** personalizable por usuario
- **Gestión de suscripción** con planes y tokens
- **Autenticación** multi-usuario con registro y login
- **Modo oscuro/claro**
- **Historial** de conversación persistente en Omnia

## Tecnologías

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **UI:** shadcn/ui (base-nova), Lucide icons, Base UI, @assistant-ui/react
- **Backend:** Omnia Gateway API (proxy via Next.js API routes)
- **Audio:** Web Speech API (navegador)
- **Producción:** pm2

## Integraciones

| Integración | Configuración |
|-------------|---------------|
| WooCommerce | URL del sitio, Consumer Key, Consumer Secret |
| Evolution API | URL del servidor, Token |
| Chatwoot | URL de instancia, API Access Token, Account ID |

Las integraciones se almacenan en localStorage y se envían a Omnia como parte del body del chat.

## Requisitos

- Node.js 18+
- npm
- pm2 (para producción)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/percy2017/openflow.git
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
```

## Producción con pm2

```bash
# Construir
npm run build

# Iniciar
pm2 start ecosystem.config.cjs

# Guardar para que reinicie automáticamente
pm2 save
pm2 startup
```

## Variables de Entorno

| Variable | Ámbito | Descripción |
|----------|--------|-------------|
| `OMNIA_BASE_URL` | Servidor | URL base de la API de Omnia |
| `NEXT_PUBLIC_OMNIA_BASE_URL` | Cliente | URL base de la API de Omnia (para imágenes) |

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/login/            # Página de login/registro
│   ├── (main)/
│   │   ├── layout.tsx           # Layout principal con header y sidebars
│   │   └── chat/                # Página de chat
│   └── api/                     # API routes (proxy a Omnia)
├── components/
│   ├── ChatClient.tsx           # Lógica principal del chat
│   ├── IntegrationsSidebar.tsx  # Sidebar de integraciones
│   ├── AppSidebar.tsx           # Sidebar izquierdo (perfil, plan)
│   ├── MarkdownEditor.tsx       # Editor markdown con toolbar
│   ├── MarkdownRenderer.tsx     # Renderizador markdown
│   ├── UsageHeader.tsx          # Barra de uso de tokens
│   ├── chat/                    # Sub-componentes del chat
│   └── ui/                      # Componentes shadcn/ui
├── lib/
│   └── auth.ts                  # Utilidades de autenticación
└── docs/
    └── integrations-json-format.md  # Documentación de integraciones
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
| `/api/integrations/chatwoot/test` | POST | Probar conexión Chatwoot |

## Licencia

MIT
