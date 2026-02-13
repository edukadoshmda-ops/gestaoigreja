import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- STABILITY PATCH (Nuclear Option) ---
// Previne erros fatais de extensões (Google Tradutor, AI Summarizer, etc) 
// que movem ou removem nós do DOM sem o conhecimento do React.
const originalRemoveChild = Node.prototype.removeChild;
(Node.prototype as any).removeChild = function (child: any) {
  if (child.parentNode !== this) {
    if (typeof console !== 'undefined') {
      console.warn('StabilityPatch: Ignorado removeChild órfão para evitar crash.', child);
    }
    return child;
  }
  return originalRemoveChild.call(this, child);
};

const originalInsertBefore = Node.prototype.insertBefore;
(Node.prototype as any).insertBefore = function (newNode: any, referenceNode: any) {
  if (referenceNode && referenceNode.parentNode !== this) {
    if (typeof console !== 'undefined') {
      console.warn('StabilityPatch: Ignorado insertBefore desalinhado.', referenceNode);
    }
    return originalInsertBefore.call(this, newNode, null);
  }
  return originalInsertBefore.call(this, newNode, referenceNode);
};
// ----------------------------------------

(window as any).onerror = function (message: any, source: any, lineno: any, colno: any, error: any) {
  if (message?.toString().indexOf('removeChild') !== -1 || message?.toString().indexOf('insertBefore') !== -1) {
    console.log('%c STABILITY WARNING: Crash de DOM evitado com sucesso pelo patch. ', 'background: #f59e0b; color: black; font-weight: bold; padding: 5px;');
    return true; // Tenta suprimir o erro se ele ainda "vazar"
  }

  console.log('%c FATAL ERROR DETECTED ', 'background: red; color: white; font-weight: bold; padding: 10px; border-radius: 5px;');
  // ... rest of error handler
  console.log('%c DESCRIÇÃO DO ERRO:', 'color: red; font-weight: bold;', message);
  console.log('%c ARQUIVO:', 'color: gray;', source, 'Linha:', lineno);
  console.error('Stack Trace:', error?.stack);

  // Mostrar um backup visual se a tela estiver branca
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
        <div style="padding: 40px; color: #ef4444; font-family: system-ui, -apple-system, sans-serif; background: #fef2f2; min-h: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
          <div style="background: white; padding: 30px; border-radius: 16px; border: 1px solid #fee2e2; shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 600px; width: 100%;">
            <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800;">Ops! Algo deu errado.</h1>
            <p style="color: #4b5563; margin-bottom: 24px; line-height: 1.5;">O sistema encontrou um erro crítico e não pôde carregar a página.</p>
            <div style="text-align: left; background: #111827; color: #10b981; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 13px; overflow: auto; max-height: 200px;">
              <p style="color: #ef4444; margin-top: 0;"># Erro Detectado:</p>
              ${message}
              <p style="color: #9ca3af; margin-top: 10px;">Arquivo: ${source?.split('/').pop()} (Linha ${lineno})</p>
            </div>
            <button onclick="window.location.reload()" style="margin-top: 24px; background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">Tentar Novamente</button>
          </div>
        </div>`;
  }
};

console.log('main.tsx: INICIANDO RENDER');
createRoot(document.getElementById("root")!).render(<App />);
console.log('main.tsx: RENDER CHAMADO');
