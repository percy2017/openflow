"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getToken, loadToken } from "@/lib/auth";

export function AuthChecker() {
  const router = useRouter();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    if (getToken()) {
      checkedRef.current = true;
      return;
    }
    loadToken().then((token) => {
      checkedRef.current = true;
      if (!token) {
        router.replace("/login");
      }
    });
  }, [router]);

  return null;
}
