export async function GET() {
  const res = await fetch("http://217.216.43.75:9000/v1/plans");
  const data = await res.json();
  return Response.json(data);
}