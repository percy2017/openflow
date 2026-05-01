export async function POST(req: Request) {
  const { url, token } = await req.json();

  if (!url || !token) {
    return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 });
  }

  try {
    const baseUrl = url.replace(/\/$/, "");
    const res = await fetch(`${baseUrl}/`, {
      method: "GET",
      headers: {
        apikey: token,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({
        success: false,
        error: res.status === 401 || res.status === 403
          ? "Token inválido"
          : `Error HTTP ${res.status}: ${text.slice(0, 200)}`,
      });
    }

    const data = await res.json();
    return Response.json({
      success: true,
      version: data.version,
      message: data.message,
    });
  } catch (e: any) {
    return Response.json({
      success: false,
      error: `No se pudo conectar: ${e.message || "error desconocido"}`,
    });
  }
}
