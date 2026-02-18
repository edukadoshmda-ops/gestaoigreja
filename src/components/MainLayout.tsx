import React, { useState } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { user, viewingChurch, exitChurchView } = useAuth();
    const showRootBanner = user?.role === 'superadmin' && viewingChurch;

    return (
        <div className="flex min-h-screen bg-background" translate="no">
            {/* Sidebar fixa - visível a partir de 768px (tablet/PC), mesma experiência que no PC */}
            <div className="hidden md:flex print:hidden border-r border-border bg-card">
                <Sidebar />
            </div>

            {/* Celular (<768px): header + conteúdo; ao toque no menu abre Sheet com Sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden flex items-center justify-between py-3 px-4 sm:py-4 border-b border-border bg-card print:hidden shadow-sm relative z-50 safe-area-padding">
                    <div className="flex items-center gap-2 min-w-0 max-w-[50vw]">
                        <Logo size="sm" showText={false} />
                        <span className="font-black text-primary text-base sm:text-lg tracking-tight truncate">Gestão Igreja</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 relative z-50">
                        <NotificationCenter />
                        <div className="relative z-50 min-h-[48px] min-w-[48px] flex items-center justify-center">
                            <ThemeSwitcher collapsed={true} direction="down" />
                        </div>
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-14 w-14 min-h-[52px] min-w-[52px] md:h-12 md:w-12 shadow-sm border border-border/50 bg-background/50 rounded-xl active:scale-95 transition-transform">
                                    <Menu className="h-8 w-8 md:h-6 md:w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-[min(16rem,85vw)] max-w-[85vw] border-r-0 rounded-r-2xl sm:w-64">
                                <div className="h-full" onClick={() => setOpen(false)}>
                                    <Sidebar />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                {/* Barra superior desktop: notificações */}
                <header className="hidden md:flex items-center justify-end gap-2 px-4 py-2 border-b border-border bg-card/50 print:hidden">
                    <NotificationCenter />
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden safe-area-padding">
                    {showRootBanner && (
                        <div className="sticky top-0 z-40 print:hidden flex items-center justify-between gap-3 px-4 py-2 sm:px-6 bg-amber-100 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                            <span className="text-sm font-medium truncate">
                                Visualizando como <strong>{viewingChurch.name}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => { exitChurchView(); navigate('/superadmin'); }}
                                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/50 hover:bg-amber-300/80 dark:hover:bg-amber-800/50 font-medium text-sm transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar ao Painel Root
                            </button>
                        </div>
                    )}
                    <div className="container mx-auto p-4 sm:p-6 md:p-8 lg:p-8 max-w-7xl animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
