"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Dialog } from "@base-ui/react/dialog";
import {
  Crown,
  Loader2,
  ChevronUp,
  Save,
  Pencil,
  Bot,
  Info,
  XCircle,
  Check,
  Copy,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  KeyRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearToken, loadToken, getToken } from "@/lib/auth";
import { useProfile } from "@/components/ProfileContext";
import { Card, CardContent } from "@/components/ui/card";

type PlanData = {
  id: number;
  name: string;
  description: string;
  monthly_price: number;
  included_tokens: number;
};

const VERSION = "v0.1.0";

export function AppSidebar() {
  const router = useRouter();
  const { profile, setProfile, clearMessages } = useProfile();
  const [profileLoading, setProfileLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadToken().then(() => {
      const token = getToken();
      if (!token) return;
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      fetch("/api/profile", { headers })
        .then((r) => {
          if (!r.ok) {
            clearToken();
            router.replace("/login");
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
          setProfileLoading(false);
        });
    });
  }, [setProfile]);

  const handleOpenEdit = () => {
    if (profile) {
      setEditForm({ name: profile.user.name, email: profile.user.email, phone: profile.user.phone || "" });
    }
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = "El nombre es obligatorio";
    if (!editForm.email.trim()) errors.email = "El email es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) errors.email = "Email inválido";

    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setConfirmEditOpen(true);
  };

  const handleConfirmSave = async () => {
    setConfirmEditOpen(false);
    if (!profile) return;
    const token = getToken();
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
        toast.success("Perfil actualizado");
      }
    } catch {
      setProfile({ ...profile, user: { ...profile.user, name: editForm.name, email: editForm.email, phone: editForm.phone } });
      toast.success("Perfil actualizado");
    }
    setEditModalOpen(false);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const token = getToken();
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
          Authorization: `Bearer ${getToken()}`,
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

  return (
    <>
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
            <div className="space-y-5">
              {/* Profile Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-sidebar-foreground">{profile.user.name}</span>
                  <button
                    onClick={handleOpenEdit}
                    className="p-1 rounded-lg hover:bg-muted transition-colors text-sidebar-foreground/40 hover:text-sidebar-foreground shrink-0"
                    title="Editar perfil"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{profile.user.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/60">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span className="truncate">{profile.user.phone || "—"}</span>
                </div>
                {profile.user.created_at && (
                  <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/40">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate">Desde {new Date(profile.user.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/40">
                  <KeyRound className="w-3 h-3 shrink-0" />
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded truncate text-sidebar-foreground/60 select-all">
                    {(getToken()?.slice(0, 20) + "..." || "No disponible")}
                  </code>
                  <button
                    onClick={() => {
                      const key = getToken();
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
                        toast.success("API Key copiada");
                      } catch {
                        toast.error("No se pudo copiar");
                      }
                    }}
                    className="p-0.5 rounded hover:bg-muted transition-colors text-sidebar-foreground/40 hover:text-sidebar-foreground"
                    title="Copiar API Key"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Plan Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Crown className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">{profile.plan.name}</span>
                <span className="text-xs ml-auto text-sidebar-foreground/60">
                  {profile.plan.monthly_price === 0 ? "Gratuito" : `$${profile.plan.monthly_price}/mes`}
                </span>
              </div>

              {/* Upgrade Card */}
              <Card
                size="sm"
                className="border-blue-500/30 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors"
                onClick={handleShowPlans}
              >
                <CardContent className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-blue-500">Mejorar plan</span>
                    <span className="text-xs text-sidebar-foreground/60">Más tokens y características</span>
                  </div>
                  <ChevronUp className="w-4 h-4 ml-auto text-blue-400 -rotate-90 shrink-0" />
                </CardContent>
              </Card>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border space-y-1">
          <Dialog.Trigger className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-muted hover:text-sidebar-foreground transition-colors">
            <Info className="w-4 h-4" />
            <span>Acerca de nosotros</span>
          </Dialog.Trigger>
        </SidebarFooter>
      </Sidebar>

      {/* About Dialog */}
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
            <p className="text-sm text-muted-foreground mb-1">{VERSION}</p>
            <p className="text-xs text-muted-foreground/50 mb-4">Built with Next.js 15</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Plataforma de agentes inteligentes impulsada por IA.
              Conecta con tus herramientas favoritas y automatiza tu negocio.
            </p>
            <div className="flex flex-col items-center gap-1 text-xs text-sidebar-foreground/50">
              <span>Desarrollado por <span className="font-medium text-sidebar-foreground/70">Omnia AI</span></span>
              <a href="https://omnia.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors">
                omnia.ai
              </a>
            </div>
          </div>
        </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
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

      {/* Edit Profile Modal */}
      <Dialog.Root open={editModalOpen} onOpenChange={setEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 isolate z-50 bg-black/40" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 outline-none">
            <Dialog.Close className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => { setEditErrors({}); }}>
              <XCircle className="w-4 h-4" />
            </Dialog.Close>
            <Dialog.Title className="font-heading text-lg font-bold mb-4">Editar perfil</Dialog.Title>
            <div className="space-y-3">
              <div>
                <input
                  value={editForm.name}
                  onChange={(e) => { setEditForm({ ...editForm, name: e.target.value }); setEditErrors((prev) => ({ ...prev, name: "" })); }}
                  placeholder="Nombre"
                  className={`w-full bg-muted border ${editErrors.name ? "border-destructive" : "border-input"} rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors`}
                />
                {editErrors.name && <p className="text-[10px] text-destructive mt-1 ml-1">{editErrors.name}</p>}
              </div>
              <div>
                <input
                  value={editForm.email}
                  onChange={(e) => { setEditForm({ ...editForm, email: e.target.value }); setEditErrors((prev) => ({ ...prev, email: "" })); }}
                  placeholder="Email"
                  type="email"
                  className={`w-full bg-muted border ${editErrors.email ? "border-destructive" : "border-input"} rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors`}
                />
                {editErrors.email && <p className="text-[10px] text-destructive mt-1 ml-1">{editErrors.email}</p>}
              </div>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Teléfono"
                type="tel"
                className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 mt-4 justify-end">
              <button
                onClick={() => { setEditModalOpen(false); setEditErrors({}); }}
                className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirm Edit Dialog */}
      <Dialog.Root open={confirmEditOpen} onOpenChange={setConfirmEditOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 isolate z-50 bg-black/40" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 outline-none">
            <Dialog.Close className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <XCircle className="w-4 h-4" />
            </Dialog.Close>
            <Dialog.Title className="text-lg font-semibold mb-2">¿Actualizar perfil?</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mb-4">
              <p>Se actualizarán los siguientes datos:</p>
              <ul className="mt-2 space-y-1">
                <li className="flex items-center gap-2"><span className="text-sidebar-foreground/60">Nombre:</span> <span className="font-medium">{editForm.name}</span></li>
                <li className="flex items-center gap-2"><span className="text-sidebar-foreground/60">Email:</span> <span className="font-medium">{editForm.email}</span></li>
                {editForm.phone && <li className="flex items-center gap-2"><span className="text-sidebar-foreground/60">Teléfono:</span> <span className="font-medium">{editForm.phone}</span></li>}
              </ul>
            </Dialog.Description>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmEditOpen(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleConfirmSave} className="px-4 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors">Actualizar</button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Plans Modal */}
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
    </>
  );
}
