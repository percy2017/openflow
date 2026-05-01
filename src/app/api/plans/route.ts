const OMNIA_BASE = process.env.OMNIA_BASE_URL || "http://217.216.43.75:9000";

export async function GET() {
  const res = await fetch(`${OMNIA_BASE}/v1/plans`);
  const data = await res.json();
  return Response.json(data);
}