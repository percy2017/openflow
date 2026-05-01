import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "sonner";
import { AuthChecker } from "@/components/AuthChecker";
import { ProfileProvider } from "@/components/ProfileContext";
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
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ProfileProvider>
          <AuthChecker />
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen">
            <header className="h-14 shrink-0 flex items-center gap-3 border-b border-border px-4 bg-background">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h1 className="text-base font-semibold text-foreground">OpenFlow AI</h1>
              <ThemeToggle />
            </header>
            <main className="flex-1 flex flex-col overflow-hidden">
              {children}
            </main>
          </SidebarInset>
        </ProfileProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}