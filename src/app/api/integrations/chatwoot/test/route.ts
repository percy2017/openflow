export async function POST(req: Request) {
  const { baseUrl, token, accountId } = await req.json();

  if (!baseUrl || !token || !accountId) {
    return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 });
  }

  try {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/api/v1/accounts/${accountId}/inboxes`, {
      method: "GET",
      headers: {
        "api_access_token": token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({
        success: false,
        error: res.status === 401 || res.status === 403
          ? "Token o Account ID inválido"
          : `Error HTTP ${res.status}: ${text.slice(0, 200)}`,
      });
    }

    return Response.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error desconocido";
    return Response.json({
      success: false,
      error: `No se pudo conectar: ${msg}`,
    });
  }
}
