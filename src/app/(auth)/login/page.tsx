"use client";

import { useEffect, useState } from "react";
import { Bot, Crown, Loader2, Check, ArrowRight } from "lucide-react";
import { saveToken } from "@/lib/auth";
import { toast } from "sonner";

type Plan = {
  id: number;
  name: string;
  description: string;
  monthly_price: number;
  included_tokens: number;
};

type CheckEmailResponse = {
  exists: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    api_key: string;
    plan: { id: number; name: string; monthly_price: number; included_tokens: number } | null;
  };
};

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "form">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [existingUser, setExistingUser] = useState<CheckEmailResponse["user"] | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => setPlans(data))
      .catch(() => {});
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa tu correo");
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: CheckEmailResponse = await res.json();

      if (data.exists && data.user) {
        setExistingUser(data.user);
        setName(data.user.name);
      } else {
        setExistingUser(null);
      }
      setStep("form");
    } catch {
      toast.error("Error al verificar email");
    }
    setCheckingEmail(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const body: { name: string; email: string; plan_id?: number } = { name, email };
      if (!existingUser) {
        body.plan_id = selectedPlan;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.api_key) {
        saveToken(data.api_key);
        toast.success(existingUser ? "Bienvenido de nuevo" : "Registro exitoso");
        setTimeout(() => {
          window.location.href = "/chat";
        }, 500);
      } else {
        toast.error(data.detail || "Error al iniciar");
      }
    } catch {
      toast.error("Error de conexión");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">OpenFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">Plataforma de agentes inteligentes</p>
        </div>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full bg-muted border border-input rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={checkingEmail}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkingEmail ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {step === "form" && (
          <div className="space-y-4">
            {existingUser ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-foreground mb-1">Bienvenido de nuevo</p>
                  <p className="text-lg font-bold text-foreground">{existingUser.name}</p>
                  <p className="text-sm text-muted-foreground">{existingUser.email}</p>
                  {existingUser.plan && (
                    <div className="flex items-center gap-2 mt-2 text-amber-500">
                      <Crown className="w-4 h-4" />
                      <span className="text-sm font-medium">{existingUser.plan.name}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-muted border border-input rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Selecciona tu plan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedPlan === plan.id
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-input bg-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-sm font-medium text-foreground">{plan.name}</span>
                          </div>
                          {selectedPlan === plan.id && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {plan.monthly_price === 0 ? "Gratuito" : `$${plan.monthly_price}/mes`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || !name.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Registrarse
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setStep("email")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Cambiar correo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}