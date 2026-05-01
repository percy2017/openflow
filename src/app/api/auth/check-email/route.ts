const OMNIA_BASE = process.env.OMNIA_BASE_URL || "http://217.216.43.75:9000";

export async function POST(req: Request) {
  const { email } = await req.json();

  const res = await fetch(`${OMNIA_BASE}/v1/check-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  return Response.json(data);
}