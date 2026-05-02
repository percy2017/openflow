"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ChatClient } from "@/components/ChatClient";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  return <ChatClient />;
}