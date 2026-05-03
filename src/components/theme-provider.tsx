"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSetting, setSetting } from "@/lib/settings";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSetting("theme").then((v) => {
      if (v === "light" || v === "dark") {
        setTheme(v);
        document.documentElement.classList.toggle("dark", v === "dark");
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    setSetting("theme", theme);
  }, [theme, ready]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
