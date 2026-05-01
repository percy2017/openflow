"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Dialog } from "@base-ui/react/dialog";
import { User, Crown, Loader2, Trash2, MessageSquare, ChevronDown, ChevronUp, Save, X, Pencil, Bot, Info, XCircle, Check, LogOut, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearToken } from "@/lib/auth";
import { useProfile } from "@/components/ProfileContext";

type PlanData = {
  id: number;
  name: string;
  description: string;
  monthly_price: number;
  included_tokens: number;
};

const VERSION = "v0.1.0";

export function AppSidebar() {
  const { profile, setProfile, updateTokens, clearMessages, messages } = useProfile();
  const [profileLoading, setProfileLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    setProfileLoading(true);
    fetch("/api/profile", { headers })
      .then((r) => {
        if (!r.ok) {
          clearToken();
          window.location.href = "/login";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setProfile(data);
        setEditForm({ name: data.user.name, email: data.user.email, phone: data.user.phone || "" });
        setProfileLoading(false);
      })
      .catch(() => {
        clearToken();
        window.location.href = "/login";
      });

    const saved = localStorage.getItem("systemPrompt");
    if (saved) setSystemPrompt(saved);
  }, []);

  const handleSystemPromptChange = (value: string) => {
    setSystemPrompt(value);
    localStorage.setItem("systemPrompt", value);
  };

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({ user: { name: editForm.name, email: editForm.email, phone: editForm.phone } }),
      });
      const data = await res.json();
      if (data.user) {
        setProfile({ ...profile, user: data.user });
      }
    } catch {
      setProfile({ ...profile, user: { ...profile.user, name: editForm.name, email: editForm.email, phone: editForm.phone } });
    }
    setEditingProfile(false);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({ name: profile.user.name, email: profile.user.email, phone: profile.user.phone || "" });
    }
    setEditingProfile(false);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    toast.success("Historial limpiado");
    await fetch("/api/conversation", { method: "DELETE", headers });
    clearMessages();
  };

  const handleShowPlans = async () => {
    setPlansLoading(true);
    setShowPlanModal(true);
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      setPlans(data);
    } catch {
      toast.error("Error cargando planes");
    }
    setPlansLoading(false);
  };

  const handleChangePlan = async (planId: number) => {
    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/profile/plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("api_key")}`,
        },
        body: JSON.stringify({ plan_id: planId }),
      });
      const data = await res.json();
      if (data.plan) {
        setProfile({ ...profile!, plan: data.plan });
        toast.success("Plan actualizado");
        setShowPlanModal(false);
      } else {
        toast.error(data.detail || "Error actualizando plan");
      }
    } catch {
      toast.error("Error actualizando plan");
    }
    setUpdatingPlan(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("api_key");
    localStorage.removeItem("systemPrompt");
    window.location.href = "/";
  };

  return (
    <Dialog.Root>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-lg">OpenFlow</h1>
              <span className="text-xs text-sidebar-foreground/50">{VERSION}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto p-4">
          {profileLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando perfil...</span>
            </div>
          )}
          {profile && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide">Perfil</span>
                {!editingProfile && (
                  <button onClick={handleEditProfile} className="p-1 rounded hover:bg-muted transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-sidebar-foreground/60" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                {editingProfile ? (
                  <div className="flex-1 space-y-2">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nombre"
                      className="w-full bg-muted border border-input rounded-lg px-2 py-1 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring"
                    />
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                      type="email"
                      className="w-full bg-muted border border-input rounded-lg px-2 py-1 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring"
                    />
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Teléfono"
                      type="tel"
                      className="w-full bg-muted border border-input rounded-lg px-2 py-1 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring"
                    />
                  </div>
                ) : (
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-sidebar-foreground truncate">{profile.user.name}</span>
                      <span className="text-xs text-sidebar-foreground/60 truncate">{profile.user.email}</span>
                      {profile.user.created_at && (
                        <span className="text-xs text-sidebar-foreground/40 truncate">
                          Desde: {new Date(profile.user.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {editingProfile && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-sidebar-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSystemPromptOpen(!systemPromptOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-sidebar-foreground/60" />
                  <span className="text-sm font-medium text-sidebar-foreground">System Prompt</span>
                  {systemPromptOpen ? (
                    <ChevronUp className="w-4 h-4 ml-auto text-sidebar-foreground/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-auto text-sidebar-foreground/60" />
                  )}
                </button>
                {systemPromptOpen && (
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => handleSystemPromptChange(e.target.value)}
                    placeholder="Escribe un system prompt..."
                    className="w-full min-h-[120px] bg-muted border border-input rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors resize-none"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">{profile.plan.name}</span>
                  <span className="text-xs ml-auto text-sidebar-foreground/60">
                    {profile.plan.monthly_price === 0 ? "Gratuito" : `$${profile.plan.monthly_price}/mes`}
                  </span>
                </div>
                <button
                  onClick={handleShowPlans}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  <span>Mejorar plan</span>
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide">Uso del mes</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sidebar-foreground/60">Tokens usados</span>
                    <span className="text-sidebar-foreground">{profile.usage.monthly_tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sidebar-foreground/60">Tokens restantes</span>
                    <span className="text-sidebar-foreground font-medium">{profile.usage.tokens_remaining.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sidebar-foreground/60">Consultas</span>
                    <span className="text-sidebar-foreground">{profile.usage.monthly_requests}</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min((profile.usage.monthly_tokens / profile.plan.included_tokens) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide">API Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate text-sidebar-foreground/70">
                    {localStorage.getItem("api_key") || "No disponible"}
                  </code>
                  <button
                    onClick={() => {
                      const key = localStorage.getItem("api_key");
                      if (!key) return;
                      try {
                        const textarea = document.createElement("textarea");
                        textarea.value = key;
                        textarea.style.position = "fixed";
                        textarea.style.opacity = "0";
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textarea);
                        toast.success("Copiado al portapapeles");
                      } catch {
                        toast.error("No se pudo copiar");
                      }
                    }}
                    className="p-1.5 rounded hover:bg-muted transition-colors text-sidebar-foreground/60"
                    title="Copiar API Key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpiar historial</span>
                </button>
              )}
            </div>
          )}
        </SidebarContent>
        <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-muted hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
          <Dialog.Trigger className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-muted hover:text-sidebar-foreground transition-colors">
            <Info className="w-4 h-4" />
            <span>Acerca de nosotros</span>
          </Dialog.Trigger>
        </SidebarFooter>
      </Sidebar>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 isolate z-50 bg-black/40 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <Dialog.Close className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <XCircle className="w-4 h-4" />
          </Dialog.Close>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <Dialog.Title className="font-heading text-xl font-bold mb-2">OpenFlow</Dialog.Title>
            <p className="text-sm text-muted-foreground mb-4">{VERSION}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Plataforma de agentes inteligentes impulsada por IA. Construido con Next.js 15, Tailwind CSS y la API de Omnia Gateway.
            </p>
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
              <span>Desarrollado por</span>
              <span className="font-medium">Omnia AI</span>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>

      <Dialog.Root open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <Dialog.Portal>
          <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center">
            <Dialog.Backdrop className="fixed inset-0 bg-black/50" />
            <div className="bg-background rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg">
              <Dialog.Title className="text-lg font-semibold mb-2">¿Limpiar historial?</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mb-4">
                Esta acción no se puede deshacer. Se eliminarán todos los mensajes de la conversación.
              </Dialog.Description>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg text-sm bg-destructive text-white hover:bg-destructive/90 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showPlanModal} onOpenChange={setShowPlanModal}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 isolate z-50 bg-black/40" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 outline-none">
            <Dialog.Close className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <XCircle className="w-4 h-4" />
            </Dialog.Close>
            <Dialog.Title className="font-heading text-lg font-bold mb-4">Planes disponibles</Dialog.Title>
            {plansLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      profile?.plan.id === plan.id ? "border-blue-500 bg-blue-500/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.included_tokens.toLocaleString()} tokens/mes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {plan.monthly_price === 0 ? "Gratuito" : `$${plan.monthly_price}`}
                      </span>
                      {profile?.plan.id === plan.id ? (
                        <div className="p-1.5 rounded-full bg-blue-500 text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleChangePlan(plan.id)}
                          disabled={updatingPlan}
                          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {updatingPlan ? "..." : "Seleccionar"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Dialog.Root>
  );
}