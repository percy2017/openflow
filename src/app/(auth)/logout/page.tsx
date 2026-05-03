"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearToken();
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "systemPrompt", value: "" }),
    }).catch(() => {});
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Saliendo...</p>
    </div>
  );
}