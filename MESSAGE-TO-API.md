# Mensaje para el Programador de la API Omnia

## Problema Actual

El endpoint `/v1/check-email` está fallando con "Internal Server Error".

## Solución Necesaria

Modificar `/v1/check-email` para que retorne los datos del usuario cuando existe:

```json
// si el email existe
{
  "exists": true,
  "user": {
    "id": 7,
    "name": "Percy",
    "email": "percyalvarez396@gmail.com",
    "api_key": "sk-omnia-CNN5VKdnohDoiyESHIiPXStWzSzNFz9X3Ls5u2Ki8",
    "plan": {
      "id": 1,
      "name": "Gratis",
      "monthly_price": 0,
      "included_tokens": 100000
    }
  }
}

// si el email NO existe
{
  "exists": false
}
```

## Código Sugerido (Python/FastAPI)

```python
@router.post("/v1/check-email")
def check_email(request: CheckEmailRequest):
    user = db.users.find_one({"email": request.email})
    if user:
        return {
            "exists": True,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "api_key": user["api_key"],
                "plan": user.get("plan")  # incluir el plan actual
            }
        }
    return {"exists": False}
```

## Por Qué Es Importante

El frontend necesita saber si el usuario existe ANTES de mostrar el formulario de registro. Con esta información podemos:

1. Mostrar "Bienvenido de nuevo [nombre]" cuando el usuario ya existe
2. No mostrar el selector de plan (ya tiene su plan asignado)
3. Evitar confusiones sobre si es "login" o "registro"

---

## Endpoints Disponibles en Omnia Gateway

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/v1/register` | Crea usuario o retorna datos si email existe |
| POST | `/v1/check-email` | **NECESITA ARREGLARSE** - Verifica si email existe |
| GET | `/v1/plans` | Lista todos los planes disponibles |
| GET | `/v1/profile` | Datos del usuario (requiere Bearer token) |
| PUT | `/v1/profile` | Actualiza perfil del usuario |
| PUT | `/v1/profile/plan` | Cambia el plan del usuario |
| GET | `/v1/conversation` | Historial de chat |
| DELETE | `/v1/conversation` | Limpia historial |
| POST | `/v1/chat/completions` | Envía mensajes al chat |

## Schemas

### CheckEmailRequest
```json
{
  "email": "string"
}
```

### CheckEmailResponse (LO QUE NECESITAMOS)
```json
{
  "exists": true,
  "user": {
    "id": 1,
    "name": "string",
    "email": "string",
    "api_key": "string",
    "plan": {
      "id": 1,
      "name": "string",
      "monthly_price": 0,
      "included_tokens": 100000
    }
  }
}
```

### RegisterRequest
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "plan_id": "integer (optional)"
}
```

### RegisterResponse
```json
{
  "id": 1,
  "name": "string",
  "email": "string",
  "api_key": "sk-omnia-...",
  "plan_id": 1,
  "is_active": true
}
```

## Nota Importante

Si `check-email` falla, el frontend puede usar `register` directamente como workaround, ya que cuando el email existe, `register` retorna los datos del usuario existente sin crear uno nuevo.
