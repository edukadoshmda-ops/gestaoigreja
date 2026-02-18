import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import "./index.css";

export default function Bootstrap() {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "timeout">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [App, setApp] = useState<ComponentType | null>(null);
  const [ErrorBoundary, setErrorBoundary] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setStatus((s) => (s === "loading" ? "timeout" : s));
    }, 15000);

    (async () => {
      try {
        const [appMod, errMod] = await Promise.all([
          import("./App.tsx"),
          import("@/components/ErrorBoundary"),
        ]);
        if (cancelled) return;
        setApp(() => appMod.default);
        setErrorBoundary(() => errMod.ErrorBoundary);
        setStatus("ready");
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        setStatus("error");
        console.error("Erro ao carregar o app:", err);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (status === "timeout") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#fef9c3", fontFamily: "system-ui", textAlign: "center", flexDirection: "column" }}>
        <div>
          <h1 style={{ color: "#854d0e", marginBottom: 16 }}>Carregamento demorou</h1>
          <p style={{ color: "#64748b", marginBottom: 8 }}>O app está demorando para carregar.</p>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: "0.875rem" }}>Abra o Console (F12) para ver erros. Verifique a conexão e o arquivo .env.local (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).</p>
          <button onClick={() => window.location.reload()} style={{ background: "#f97316", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#fef2f2", fontFamily: "system-ui", textAlign: "center" }}>
        <div>
          <h1 style={{ color: "#991b1b", marginBottom: 16 }}>Erro ao carregar</h1>
          <p style={{ color: "#4b5563", marginBottom: 24 }}>{errorMsg}</p>
          <button onClick={() => window.location.reload()} style={{ background: "#dc2626", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Recarregar</button>
        </div>
      </div>
    );
  }

  if (status === "ready" && App && ErrorBoundary) {
    return (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "system-ui", color: "#64748b", fontSize: "1.125rem" }}>
      Carregando…
    </div>
  );
}
