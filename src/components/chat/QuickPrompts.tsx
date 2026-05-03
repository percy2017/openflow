"use client";

import type { PromptsData } from "@/lib/prompts";

export function QuickPrompts({
  prompts,
  enabledIntegrations,
  onSelect,
}: {
  prompts: PromptsData | null;
  enabledIntegrations: string[];
  onSelect: (text: string) => void;
}) {
  if (!prompts) return null;

  const all: { key: string; text: string }[] = [];
  if (prompts.general?.quickPrompts) {
    for (const q of prompts.general.quickPrompts) {
      all.push({ key: "general", text: q });
    }
  }
  for (const key of enabledIntegrations) {
    const entry = prompts[key as keyof PromptsData];
    if (entry?.quickPrompts) {
      for (const q of entry.quickPrompts) {
        all.push({ key, text: q });
      }
    }
  }

  if (all.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {all.map((q, i) => (
        <button
          key={`${q.key}-${i}`}
          onClick={() => onSelect(q.text)}
          className="px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 border border-border text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all hover:border-blue-500/30 whitespace-nowrap"
        >
          {q.text}
        </button>
      ))}
    </div>
  );
}
