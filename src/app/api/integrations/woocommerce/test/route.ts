const OMNIA_BASE = process.env.OMNIA_BASE_URL || "http://217.216.43.75:9000";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { siteUrl, consumerKey, consumerSecret } = await req.json();

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 });
  }

  try {
    const url = siteUrl.replace(/\/$/, "");
    const res = await fetch(`${url}/wp-json/wc/v3/system_status`, {
      headers: {
        Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({
        success: false,
        error: res.status === 401 ? "Credenciales inválidas" : `Error HTTP ${res.status}: ${text.slice(0, 200)}`,
      });
    }

    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({
      success: false,
      error: `No se pudo conectar: ${e.message || "error desconocido"}`,
    });
  }
}
