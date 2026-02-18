import { Buffer } from "buffer";
// Polyfill para qrcode-pix (usa Buffer.from no browser)
(globalThis as unknown as { Buffer?: typeof Buffer }).Buffer = Buffer;
if (typeof window !== "undefined") (window as unknown as { Buffer?: typeof Buffer }).Buffer = Buffer;

import "./index.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App";

function showErrorPage(message: string) {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; font-family: system-ui, sans-serif; background: #fef2f2; min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
        <div style="background: white; padding: 30px; border-radius: 16px; border: 1px solid #fee2e2; max-width: 560px;">
          <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #991b1b;">Ops! Algo deu errado.</h1>
          <p style="color: #4b5563; margin-bottom: 24px;">${message}</p>
          <button onclick="window.location.reload()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">Tentar novamente</button>
        </div>
      </div>`;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:2rem;font-family:system-ui;color:#dc2626;">Erro: elemento #root não encontrado.</div>';
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    showErrorPage(msg);
    console.error("Erro ao montar o app:", err);
  }
}
