import { getPrompts, savePrompts } from "@/lib/prompts";

export async function GET() {
  const data = getPrompts();
  return Response.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json();
  savePrompts(body);
  return Response.json({ success: true });
}
