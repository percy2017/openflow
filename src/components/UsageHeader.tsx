"use client";

import { useProfile } from "@/components/ProfileContext";

export function UsageHeader() {
  const { profile } = useProfile();

  if (!profile) return null;

  const used = profile.usage.monthly_tokens;
  const remaining = profile.usage.tokens_remaining;
  const total = profile.plan.included_tokens;
  const percent = Math.min((used / total) * 100, 100);

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="hidden sm:flex items-center gap-3 flex-1 max-w-[320px]">
        <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden min-w-[80px]">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
            {used.toLocaleString()} / {total.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground/60 tabular-nums whitespace-nowrap">
            {remaining.toLocaleString()} restantes
          </span>
        </div>
      </div>
    </div>
  );
}
