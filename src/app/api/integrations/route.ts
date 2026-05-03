import { NextRequest } from "next/server";
import { get, set } from "@/lib/db";

const INTEGRATION_KEY = "integrations";

export async function GET() {
  const raw = get(INTEGRATION_KEY);
  const data = raw ? JSON.parse(raw) : { enabled: [] };
  return Response.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  set(INTEGRATION_KEY, JSON.stringify(body));
  return Response.json({ success: true });
}

export async function DELETE() {
  set(INTEGRATION_KEY, JSON.stringify({ enabled: [] }));
  return Response.json({ success: true });
}
