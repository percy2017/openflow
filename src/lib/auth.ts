let cachedToken: string | null = null;

export function getToken(): string | null {
  return cachedToken;
}

export async function saveToken(token: string): Promise<void> {
  cachedToken = token;
  await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "api_key", value: token }),
  });
}

export function clearToken(): void {
  cachedToken = null;
  fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "api_key", value: "" }),
  }).catch(() => {});
}

export async function loadToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/settings?key=api_key");
    const data = await res.json();
    cachedToken = data.value || null;
    return cachedToken;
  } catch {
    cachedToken = null;
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!cachedToken;
}
