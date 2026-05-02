const OMNIA_BASE = process.env.OMNIA_BASE_URL || "http://217.216.43.75:9000";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, integrations } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = { messages };
  if (integrations) {
    body.integrations = integrations;
  }

  console.log("[chat-proxy] Sending to Omnia:", JSON.stringify(body).slice(0, 600));

  const res = await fetch(`${OMNIA_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  console.log("[chat-proxy] Omnia status:", res.status);

  const text = await res.text();

  if (!res.ok) {
    console.log("[chat-proxy] Omnia error:", text.slice(0, 500));
    return Response.json({ error: text, status: res.status }, { status: res.status });
  }

  console.log("[chat-proxy] Omnia response:", text.slice(0, 400));

  try {
    return Response.json(JSON.parse(text));
  } catch {
    return new Response(text, {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
