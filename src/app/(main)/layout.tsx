"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { UsageHeader } from "@/components/UsageHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IntegrationsSidebar } from "@/components/IntegrationsSidebar";
import { Toaster, toast } from "sonner";
import { AuthChecker } from "@/components/AuthChecker";
import { ProfileProvider } from "@/components/ProfileContext";
import { Button } from "@/components/ui/button";
import { Plug, LogOut, Trash2, Download, XCircle } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("api_key");
    localStorage.removeItem("systemPrompt");
    localStorage.removeItem("integrations");
    window.location.href = "/";
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("/api/conversation", { headers });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Historial descargado");
    } catch {
      toast.error("Error al descargar el historial");
    }
  };

  const handleClear = async () => {
    setShowClearConfirm(false);
    const token = localStorage.getItem("api_key");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    toast.success("Historial limpiado");
    await fetch("/api/conversation", { method: "DELETE", headers });
    window.location.reload();
  };

  return (
    <ThemeProvider>
      <SidebarProvider>
        <ProfileProvider>
          <AuthChecker />
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen">
            <header className="h-14 shrink-0 flex items-center gap-3 border-b border-border px-4 bg-background">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <UsageHeader />
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-slate-400 hover:text-red-400"
                  aria-label="Limpiar historial"
                  title="Limpiar historial"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDownload}
                  className="text-slate-400 hover:text-white"
                  aria-label="Descargar historial"
                  title="Descargar historial"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIntegrationsOpen(!integrationsOpen)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Integraciones"
                  title={integrationsOpen ? "Cerrar integraciones" : "Abrir integraciones"}
                  data-active={integrationsOpen || undefined}
                >
                  <Plug className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-slate-400 hover:text-red-400"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 flex flex-col overflow-hidden">
              {children}
            </main>
          </SidebarInset>
          <IntegrationsSidebar open={integrationsOpen} onOpenChange={setIntegrationsOpen} />

          {/* Clear History Dialog */}
          <Dialog.Root open={showClearConfirm} onOpenChange={setShowClearConfirm}>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 isolate z-50 bg-black/40" />
              <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 outline-none">
                <Dialog.Close className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <XCircle className="w-4 h-4" />
                </Dialog.Close>
                <Dialog.Title className="text-lg font-semibold mb-2">¿Limpiar historial?</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mb-4">
                  Esta acción no se puede deshacer. Se eliminarán todos los mensajes de la conversación.
                </Dialog.Description>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors">Cancelar</button>
                  <button onClick={handleClear} className="px-4 py-2 rounded-lg text-sm bg-destructive text-white hover:bg-destructive/90 transition-colors">Eliminar</button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Logout Confirmation Dialog */}
          <Dialog.Root open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 isolate z-50 bg-black/40" />
              <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 outline-none">
                <Dialog.Close className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <XCircle className="w-4 h-4" />
                </Dialog.Close>
                <Dialog.Title className="text-lg font-semibold mb-2">¿Cerrar sesión?</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mb-4">
                  Se eliminarán tus credenciales, system prompt e integraciones de este navegador.
                </Dialog.Description>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors">Cancelar</button>
                  <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm bg-destructive text-white hover:bg-destructive/90 transition-colors">Cerrar sesión</button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </ProfileProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
