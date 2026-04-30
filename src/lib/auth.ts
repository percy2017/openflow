export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("api_key");
}

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("api_key", token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("api_key");
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
