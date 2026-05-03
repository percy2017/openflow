import { getBaseUrl } from "@/lib/omnia";

export async function POST(req: Request) {
  const { email } = await req.json();

  const res = await fetch(`${getBaseUrl()}/v1/check-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  return Response.json(data);
}