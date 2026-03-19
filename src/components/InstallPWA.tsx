import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any)?.standalone);

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const { currentTheme } = useTheme();

  const logoColor = currentTheme?.primaryHex || "hsl(var(--primary))";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("pwa-dismissed")) return;
    if (isStandalone()) return;

    // 1. Verifica se o evento já foi capturado globalmente antes do React montar
    const globalPrompt = (window as any).deferredPrompt as BeforeInstallPromptEvent | undefined;
    if (globalPrompt) {
      setDeferredPrompt(globalPrompt);
    }

    // 2. Escuta novos eventos (caso o React já esteja montado quando o evento disparar)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredPrompt = e; // sincroniza globalmente
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 3. Sempre mostra o banner após 1.5s (independente do evento nativo)
    const timer = setTimeout(() => setShowBanner(true), 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    // Tenta o deferredPrompt do state, ou do global como último recurso
    const prompt = deferredPrompt || ((window as any).deferredPrompt as BeforeInstallPromptEvent | undefined);
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setShowBanner(false);
    } else {
      setShowHelpDialog(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-md md:bottom-6 md:left-6 md:max-w-[420px] z-50 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 rounded-2xl shadow-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 animate-in slide-in-from-bottom-4">
        <div
          className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0 transition-colors duration-500"
          style={{
            backgroundColor: logoColor,
            WebkitMaskImage: `url(/logo-app.png)`,
            maskImage: `url(/logo-app.png)`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
          title="Gestão Igreja"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-black dark:text-white text-sm sm:text-base md:text-lg">Instalar App</p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Use Gestão Igreja como app no celular, tablet ou PC
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleInstall} className="gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" />
            <span className="font-bold">Instalar</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full hover:bg-muted" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar App</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                {isIOS ? (
                  <>
                    <p><strong>No Safari (iPhone/iPad):</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Toque no ícone <strong>Compartilhar</strong> (seta para cima) na barra inferior</li>
                      <li>Role e toque em <strong>Adicionar à Tela de Início</strong></li>
                      <li>Toque em <strong>Adicionar</strong></li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p><strong>No Chrome ou Edge (PC, tablet, Android):</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Toque no menu <strong>⋮</strong> (três pontos) no canto superior direito</li>
                      <li>Selecione <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong></li>
                    </ol>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
