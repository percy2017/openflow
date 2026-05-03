"use client";

import { SidebarHeader, SidebarContent } from "@/components/ui/sidebar";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Lightbulb, X, Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import type { PromptsData, PromptEntry } from "@/lib/prompts";
import { toast } from "sonner";

type IntegrationKey = "general" | "woocommerce" | "evolution" | "chatwoot";

const INTEGRATION_OPTIONS: { key: IntegrationKey; label: string }[] = [
  { key: "general", label: "General" },
  { key: "woocommerce", label: "WooCommerce" },
  { key: "evolution", label: "Evolution API" },
  { key: "chatwoot", label: "Chatwoot" },
];

export function PromptsSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [prompts, setPrompts] = useState<PromptsData | null>(null);
  const [selected, setSelected] = useState<IntegrationKey>("general");
  const [activeKey, setActiveKey] = useState<string>("general");
  const [entry, setEntry] = useState<PromptEntry | null>(null);
  const [newQuick, setNewQuick] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/prompts").then((r) => r.json()).then((data) => {
      setPrompts(data);
      setActiveKey(data.activeKey || "general");
      setSelected(data.activeKey || "general");
      setEntry(data[data.activeKey || "general"]);
    });
  }, [open]);

  const handleSelect = (key: IntegrationKey) => {
    setSelected(key);
    if (prompts) setEntry({ ...prompts[key] });
    setNewQuick("");
  };

  const handleActivate = () => {
    if (!prompts) return;
    const updated = { ...prompts, activeKey: selected };
    setPrompts(updated);
    setActiveKey(selected);
    fetch("/api/prompts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const label = INTEGRATION_OPTIONS.find((o) => o.key === selected)?.label || selected;
    toast.success(`Prompt "${label}" activado`);
  };

  const save = useCallback((e: PromptEntry) => {
    if (!prompts) return;
    const updated = { ...prompts, [selected]: e };
    setPrompts(updated);
    setEntry(e);
    fetch("/api/prompts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  }, [prompts, selected]);

  const addQuick = () => {
    const t = newQuick.trim();
    if (!t || !entry) return;
    save({ ...entry, quickPrompts: [...entry.quickPrompts, t] });
    setNewQuick("");
  };

  const removeQuick = (i: number) => {
    if (!entry) return;
    save({ ...entry, quickPrompts: entry.quickPrompts.filter((_, idx) => idx !== i) });
  };

  const isActive = selected === activeKey;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 md:bg-black/0" onClick={() => onOpenChange(false)} />}
      <div className={cn(
        "fixed top-0 right-0 z-40 h-full w-80 bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-lg flex flex-col",
        "transition-transform duration-200 ease-linear",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <SidebarHeader className="p-4 border-b border-sidebar-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sidebar-foreground/60" />
              <h2 className="font-semibold text-sm">Prompts</h2>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sidebar-foreground/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <select
            value={selected}
            onChange={(e) => handleSelect(e.target.value as IntegrationKey)}
            className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground focus:outline-none focus:border-ring transition-colors"
          >
            {INTEGRATION_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleActivate}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-green-500/10 text-green-500 border border-green-500/30 cursor-default"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isActive ? <><CheckCircle className="w-4 h-4" /> Activo</> : <>Usar este prompt</>}
          </button>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto p-3">
          {entry && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60 mb-1.5">
                  <MessageSquare className="w-3 h-3" /> System Prompt
                </label>
                <MarkdownEditor
                  value={entry.systemPrompt}
                  onChange={(v) => save({ ...entry, systemPrompt: v })}
                  placeholder="Escribe un system prompt..."
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60 mb-1.5">
                  <Lightbulb className="w-3 h-3" /> Quick Prompts
                </label>
                <div className="space-y-1.5">
                  {entry.quickPrompts.map((q, i) => (
                    <div key={i} className="flex items-center gap-1.5 group">
                      <span className="flex-1 text-xs text-sidebar-foreground/80 px-2 py-1 rounded bg-muted/50">{q}</span>
                      <button onClick={() => removeQuick(i)} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    value={newQuick}
                    onChange={(e) => setNewQuick(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuick(); } }}
                    placeholder="Nuevo quick prompt..."
                    className="flex-1 bg-muted border border-input rounded-lg px-2.5 py-1.5 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors"
                  />
                  <button onClick={addQuick} disabled={!newQuick.trim()} className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </SidebarContent>
      </div>
    </>
  );
}
