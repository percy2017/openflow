import { get } from "@/lib/db";

export function getBaseUrl(): string {
  const stored = get("omnia_base_url");
  if (stored) return stored;
  return process.env.OMNIA_BASE_URL || "http://omnia.local";
}
