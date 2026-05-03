import { NextRequest } from "next/server";
import { get, set } from "@/lib/db";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return Response.json({ error: "key is required" }, { status: 400 });
  const value = get(key);
  return Response.json({ key, value });
}

export async function PUT(req: NextRequest) {
  const { key, value } = await req.json();
  if (!key) return Response.json({ error: "key is required" }, { status: 400 });
  set(key, String(value ?? ""));
  return Response.json({ success: true });
}
