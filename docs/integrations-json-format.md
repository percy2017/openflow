# Formatos JSON de Integraciones — OpenFlow → Omnia API

El frontend envía las integraciones en el body del `POST /v1/chat/completions` dentro de la propiedad `integrations`. Cada integración habilitada se incluye como una clave independiente.

## Estructura general del request

```json
{
  "messages": [
    { "role": "system", "content": "... (opcional)" },
    { "role": "user", "content": "mensaje del usuario" }
  ],
  "integrations": {
    "woocommerce": { ... },
    "evolution": { ... },
    "chatwoot": { ... }
  }
}
```

Solo se envían las integraciones que el usuario tiene **habilitadas y conectadas**. Si no hay ninguna, la propiedad `integrations` no se incluye.

---

## WooCommerce

```json
{
  "integrations": {
    "woocommerce": {
      "siteUrl": "https://tutienda.com",
      "consumerKey": "ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "consumerSecret": "cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `siteUrl` | string | URL base de la tienda WooCommerce |
| `consumerKey` | string | Consumer Key generada en WooCommerce → Ajustes → Avanzado → API REST |
| `consumerSecret` | string | Consumer Secret correspondiente |

---

## Evolution API

```json
{
  "integrations": {
    "evolution": {
      "url": "http://217.216.43.75:2001",
      "token": "evolution2001"
    }
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `url` | string | URL base del servidor Evolution API |
| `token` | string | API key o token de autenticación (se envía como header `apikey`) |

---

## Chatwoot

```json
{
  "integrations": {
    "chatwoot": {
      "baseUrl": "https://app.chatwoot.com",
      "token": "tu-access-token",
      "accountId": "1"
    }
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `baseUrl` | string | URL de la instancia Chatwoot (p.ej. `https://app.chatwoot.com`) |
| `token` | string | API Access Token generado en Settings → Profile → Access Token |
| `accountId` | string | ID numérico de la cuenta (se ve en la URL: `/app/accounts/1/...`) |

---

## Archivos adjuntos (imágenes)

Cuando el usuario adjunta imágenes, el mensaje `user` incluye un array `files`:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "describe esta imagen",
      "files": [
        {
          "name": "imagen_123456.png",
          "data": "iVBORw0KGgo... (base64 sin prefijo)",
          "type": "image/png"
        }
      ]
    }
  ]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre del archivo |
| `data` | string | Contenido del archivo en **base64 puro** (sin prefijo `data:image/...;base64,`) |
| `type` | string | MIME type: `image/jpeg`, `image/png`, `image/gif` o `image/webp` |

**Límites:** Máximo 5 MB por archivo. Solo imágenes.

---

## System Prompt

Cuando el usuario define un system prompt, se antepone como primer mensaje:

```json
{
  "messages": [
    { "role": "system", "content": "Eres un asistente útil..." },
    { "role": "user", "content": "mensaje" }
  ]
}
```

---

## Notas para el desarrollador de la API

1. **Integraciones como clave-valor:** El objeto `integrations` es plano. Cada integración se identifica por su clave (`woocommerce`, `evolution`, `chatwoot`). El backend de Omnia debe leer las que necesita y/o soportar.

2. **Autenticación:** El token de Omnia se envía como header `Authorization: Bearer sk-omnia-...`.

3. **Historial:** La respuesta de Omnia debe incluir `history` (array de mensajes) para que el frontend reconstruya la conversación completa vía `GET /v1/conversation`. El frontend **no** confía en `data.history` de la respuesta del chat — siempre refetch de `/v1/conversation` después de cada mensaje.

4. **Tool calls múltiples:** Un mismo mensaje `assistant` puede contener múltiples `tool_calls`. El frontend espera cada tool call como un elemento individual dentro del array `tool_calls`:
   ```json
   {
     "role": "assistant",
     "content": "...",
     "tool_calls": [
       { "id": "call_1", "function": { "name": "get_orders", "arguments": "{}" } },
       { "id": "call_2", "function": { "name": "get_products", "arguments": "{}" } }
     ]
   }
   ```

5. **Conversation response format:** El endpoint `GET /v1/conversation` debe devolver los mensajes en un array plano, cada uno con `role`, `content`, y opcionalmente `tool_calls`, `thinking`, `files`, `tool_name`.
