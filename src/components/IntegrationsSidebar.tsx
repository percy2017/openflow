"use client";

import { SidebarHeader, SidebarContent } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { Plug, Globe, Key, Lock, CheckCircle, Loader2, ExternalLink, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, X, MessageSquare, Server, MessageCircle, Hash } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { getSetting, setSetting, getIntegrations, setIntegrations } from "@/lib/settings";

type WooConfig = {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

type EvolutionConfig = {
  url: string;
  token: string;
};

type ChatwootConfig = {
  baseUrl: string;
  token: string;
  accountId: string;
};

type IntegrationsData = {
  enabled: string[];
  woocommerce?: WooConfig;
  evolution?: EvolutionConfig;
  chatwoot?: ChatwootConfig;
};

type IntegrationCardProps = {
  title: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isEnabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function IntegrationCard({ title, icon, isConnected, isEnabled, onToggle, children, defaultOpen = false }: IntegrationCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-sidebar-border overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            {open ? (
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
            )}
            {icon}
            <span className="text-sm font-medium text-sidebar-foreground">{title}</span>
            {isConnected && (
              <span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
                <CheckCircle className="w-3 h-3" />
                Conectado
              </span>
            )}
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onToggle(); } }}
            className={`cursor-pointer transition-colors ${isEnabled ? "text-blue-500" : "text-sidebar-foreground/30"}`}
            title={isEnabled ? "Desactivar" : "Activar"}
            aria-label={isEnabled ? "Desactivar" : "Activar"}
          >
            {isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 space-y-3">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function IntegrationsSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [data, setData] = useState<IntegrationsData>({ enabled: [] });
  const [wcForm, setWcForm] = useState<WooConfig>({ siteUrl: "", consumerKey: "", consumerSecret: "" });
  const [evForm, setEvForm] = useState<EvolutionConfig>({ url: "", token: "" });
  const [cwForm, setCwForm] = useState<ChatwootConfig>({ baseUrl: "", token: "", accountId: "" });
  const [testing, setTesting] = useState(false);
  const [wcConnected, setWcConnected] = useState(false);
  const [evConnected, setEvConnected] = useState(false);
  const [cwConnected, setCwConnected] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [systemPromptOpen, setSystemPromptOpen] = useState(true);

  useEffect(() => {
    getIntegrations<IntegrationsData>().then((d) => {
      setData(d);
      if (d.woocommerce) { setWcForm(d.woocommerce); setWcConnected(true); }
      if (d.evolution) { setEvForm(d.evolution); setEvConnected(true); }
      if (d.chatwoot) { setCwForm(d.chatwoot); setCwConnected(true); }
    });
    getSetting("systemPrompt").then((v) => setSystemPrompt(v || ""));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onOpenChange]);

  const saveData = (d: IntegrationsData) => {
    setIntegrations(d);
  };

  const handleSystemPromptChange = (value: string) => {
    setSystemPrompt(value);
    setSetting("systemPrompt", value);
  };

  const wcEnabled = data.enabled.includes("woocommerce");
  const evEnabled = data.enabled.includes("evolution");
  const cwEnabled = data.enabled.includes("chatwoot");

  const toggleEnabled = (key: string) => {
    const updated = { ...data };
    if (data.enabled.includes(key)) {
      updated.enabled = updated.enabled.filter((k) => k !== key);
    } else {
      updated.enabled = [...updated.enabled, key];
    }
    saveData(updated);
    setData(updated);
  };

  const handleWcConnect = async () => {
    if (!wcForm.siteUrl || !wcForm.consumerKey || !wcForm.consumerSecret) {
      toast.error("Completa todos los campos");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/integrations/woocommerce/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wcForm),
      });
      const result = await res.json();
      if (result.success) {
        const updated: IntegrationsData = {
          ...data,
          woocommerce: wcForm,
          enabled: data.enabled.includes("woocommerce") ? data.enabled : [...data.enabled, "woocommerce"],
        };
        saveData(updated);
        setData(updated);
        setWcConnected(true);
        toast.success("WooCommerce conectado exitosamente");
      } else {
        toast.error(result.error || "Error de conexión");
      }
    } catch {
      toast.error("No se pudo conectar a WooCommerce");
    }
    setTesting(false);
  };

  const handleWcDisconnect = () => {
    const updated: IntegrationsData = {
      ...data,
      woocommerce: undefined,
      enabled: data.enabled.filter((k) => k !== "woocommerce"),
    };
    saveData(updated);
    setData(updated);
    setWcConnected(false);
    setWcForm({ siteUrl: "", consumerKey: "", consumerSecret: "" });
    toast.success("WooCommerce desconectado");
  };

  const handleEvConnect = async () => {
    if (!evForm.url || !evForm.token) {
      toast.error("Completa todos los campos");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/integrations/evolution/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evForm),
      });
      const result = await res.json();
      if (result.success) {
        const updated: IntegrationsData = {
          ...data,
          evolution: evForm,
          enabled: data.enabled.includes("evolution") ? data.enabled : [...data.enabled, "evolution"],
        };
        saveData(updated);
        setData(updated);
        setEvConnected(true);
        toast.success("Evolution API conectada exitosamente");
      } else {
        toast.error(result.error || "Error de conexión");
      }
    } catch {
      toast.error("No se pudo conectar a Evolution API");
    }
    setTesting(false);
  };

  const handleEvDisconnect = () => {
    const updated: IntegrationsData = {
      ...data,
      evolution: undefined,
      enabled: data.enabled.filter((k) => k !== "evolution"),
    };
    saveData(updated);
    setData(updated);
    setEvConnected(false);
    setEvForm({ url: "", token: "" });
    toast.success("Evolution API desconectada");
  };

  const handleCwConnect = async () => {
    if (!cwForm.baseUrl || !cwForm.token || !cwForm.accountId) {
      toast.error("Completa todos los campos");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/integrations/chatwoot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cwForm),
      });
      const result = await res.json();
      if (result.success) {
        const updated: IntegrationsData = {
          ...data,
          chatwoot: cwForm,
          enabled: data.enabled.includes("chatwoot") ? data.enabled : [...data.enabled, "chatwoot"],
        };
        saveData(updated);
        setData(updated);
        setCwConnected(true);
        toast.success("Chatwoot conectado exitosamente");
      } else {
        toast.error(result.error || "Error de conexión");
      }
    } catch {
      toast.error("No se pudo conectar a Chatwoot");
    }
    setTesting(false);
  };

  const handleCwDisconnect = () => {
    const updated: IntegrationsData = {
      ...data,
      chatwoot: undefined,
      enabled: data.enabled.filter((k) => k !== "chatwoot"),
    };
    saveData(updated);
    setData(updated);
    setCwConnected(false);
    setCwForm({ baseUrl: "", token: "", accountId: "" });
    toast.success("Chatwoot desconectado");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:bg-black/0"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 z-40 h-full w-80 bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-lg",
          "transition-transform duration-200 ease-linear",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plug className="w-5 h-5 text-sidebar-foreground/60" />
              <h2 className="font-semibold text-sm">Integraciones</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sidebar-foreground/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* System Prompt - first */}
          <div className="rounded-lg border border-sidebar-border overflow-hidden">
            <Collapsible open={systemPromptOpen} onOpenChange={setSystemPromptOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
                {systemPromptOpen ? (
                  <ChevronDown className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-sidebar-foreground/40 shrink-0" />
                )}
                <MessageSquare className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
                <span className="font-medium text-sidebar-foreground">System Prompt</span>
                {systemPrompt && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-green-500 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Activo
                  </span>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3">
                  <MarkdownEditor
                    value={systemPrompt}
                    onChange={handleSystemPromptChange}
                    placeholder="Escribe un system prompt para personalizar el comportamiento del agente..."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* WooCommerce */}
          <IntegrationCard
            title="WooCommerce"
            icon={<Globe className="w-4 h-4 text-blue-500 shrink-0" />}
            isConnected={wcConnected}
            isEnabled={wcEnabled}
            onToggle={() => toggleEnabled("woocommerce")}
          >
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Globe className="w-3 h-3" />
                URL del sitio
              </label>
              <input
                value={wcForm.siteUrl}
                onChange={(e) => setWcForm({ ...wcForm, siteUrl: e.target.value })}
                placeholder="https://tutienda.com"
                disabled={testing}
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Key className="w-3 h-3" />
                Consumer Key
              </label>
              <input
                value={wcForm.consumerKey}
                onChange={(e) => setWcForm({ ...wcForm, consumerKey: e.target.value })}
                placeholder="ck_xxxxxxxxxxxx"
                disabled={testing}
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Lock className="w-3 h-3" />
                Consumer Secret
              </label>
              <input
                value={wcForm.consumerSecret}
                onChange={(e) => setWcForm({ ...wcForm, consumerSecret: e.target.value })}
                placeholder="cs_xxxxxxxxxxxx"
                type="password"
                disabled={testing}
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {wcConnected ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2.5 py-1.5 rounded-lg">
                    <CheckCircle className="w-3 h-3" />
                    Conectado
                  </div>
                  <button
                    onClick={handleWcDisconnect}
                    className="text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleWcConnect}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Probando...</>
                  ) : (
                    <><CheckCircle className="w-3 h-3" /> Conectar</>
                  )}
                </button>
              )}
            </div>
            <p className="text-[10px] text-sidebar-foreground/40 leading-relaxed">
              Genera tus credenciales en WooCommerce &gt; Ajustes &gt; Avanzado &gt; API REST.
              <a href="https://woocommerce.com/document/woocommerce-rest-api/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-400 ml-1">
                Guía <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </IntegrationCard>

          {/* Evolution API */}
          <IntegrationCard
            title="Evolution API"
            icon={<Server className="w-4 h-4 text-purple-500 shrink-0" />}
            isConnected={evConnected}
            isEnabled={evEnabled}
            onToggle={() => toggleEnabled("evolution")}
          >
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Server className="w-3 h-3" />
                URL del servidor
              </label>
              <input
                value={evForm.url}
                onChange={(e) => setEvForm({ ...evForm, url: e.target.value })}
                placeholder="http://217.216.43.75:2001"
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Key className="w-3 h-3" />
                Token
              </label>
              <input
                value={evForm.token}
                onChange={(e) => setEvForm({ ...evForm, token: e.target.value })}
                placeholder="evolution2001"
                type="password"
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {evConnected ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2.5 py-1.5 rounded-lg">
                    <CheckCircle className="w-3 h-3" />
                    Conectado
                  </div>
                  <button
                    onClick={handleEvDisconnect}
                    className="text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEvConnect}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Probando...</>
                  ) : (
                    <><CheckCircle className="w-3 h-3" /> Conectar</>
                  )}
                </button>
              )}
            </div>
          </IntegrationCard>

          {/* Chatwoot */}
          <IntegrationCard
            title="Chatwoot"
            icon={<MessageCircle className="w-4 h-4 text-cyan-500 shrink-0" />}
            isConnected={cwConnected}
            isEnabled={cwEnabled}
            onToggle={() => toggleEnabled("chatwoot")}
          >
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Globe className="w-3 h-3" />
                URL de instancia
              </label>
              <input
                value={cwForm.baseUrl}
                onChange={(e) => setCwForm({ ...cwForm, baseUrl: e.target.value })}
                placeholder="https://app.chatwoot.com"
                disabled={testing}
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Key className="w-3 h-3" />
                API Access Token
              </label>
              <input
                value={cwForm.token}
                onChange={(e) => setCwForm({ ...cwForm, token: e.target.value })}
                placeholder="tu-access-token"
                type="password"
                disabled={testing}
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                <Hash className="w-3 h-3" />
                Account ID
              </label>
              <input
                value={cwForm.accountId}
                onChange={(e) => setCwForm({ ...cwForm, accountId: e.target.value })}
                placeholder="1"
                disabled={testing}
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring transition-colors font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {cwConnected ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2.5 py-1.5 rounded-lg">
                    <CheckCircle className="w-3 h-3" />
                    Conectado
                  </div>
                  <button
                    onClick={handleCwDisconnect}
                    className="text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCwConnect}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Probando...</>
                  ) : (
                    <><CheckCircle className="w-3 h-3" /> Conectar</>
                  )}
                </button>
              )}
            </div>
          </IntegrationCard>

          {/* Future integrations placeholder */}
          <div className="px-3 py-3 rounded-lg border border-dashed border-sidebar-border text-center">
            <p className="text-xs text-sidebar-foreground/40">Más integraciones próximamente</p>
          </div>
        </SidebarContent>
      </div>
    </>
  );
}
