export async function getSetting(key: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/settings?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    return data.value || null;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
}

export async function getIntegrations<T = Record<string, unknown>>(): Promise<T> {
  try {
    const res = await fetch("/api/integrations");
    return await res.json();
  } catch {
    return { enabled: [] } as unknown as T;
  }
}

export async function setIntegrations(data: Record<string, unknown>): Promise<void> {
  await fetch("/api/integrations", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
