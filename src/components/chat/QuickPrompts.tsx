"use client";

import type { PromptEntry } from "@/lib/prompts";

export function QuickPrompts({
  prompts,
  onSelect,
}: {
  prompts: { activeKey: string; [key: string]: unknown } | null;
  onSelect: (text: string) => void;
}) {
  if (!prompts) return null;

  const activeKey = (prompts.activeKey as string) || "general";
  const active = prompts[activeKey] as PromptEntry | undefined;
  const items = active?.quickPrompts || [];

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {items.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 border border-border text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all hover:border-blue-500/30 whitespace-nowrap"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
