"use client";

import { useEffect } from "react";
import { XCircle, RefreshCw } from "lucide-react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <XCircle className="w-12 h-12 text-destructive" />
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  );
}
