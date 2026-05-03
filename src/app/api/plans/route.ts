import { getBaseUrl } from "@/lib/omnia";

export async function GET() {
  const res = await fetch(`${getBaseUrl()}/v1/plans`);
  const data = await res.json();
  return Response.json(data);
}