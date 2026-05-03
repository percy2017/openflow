import { getBaseUrl } from "@/lib/omnia";

export async function POST(req: Request) {
  try {
    const { name, email, plan_id } = await req.json();

    const body: { name: string; email: string; plan_id?: number } = { name, email };
    if (plan_id) {
      body.plan_id = plan_id;
    }

    const res = await fetch(`${getBaseUrl()}/v1/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ detail: "Error de conexión con el servidor. Intenta de nuevo." }, { status: 502 });
  }
}