import { useState, useRef, useEffect } from 'react';
import { Palette, Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, themes } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ collapsed, direction = 'up' }: { collapsed: boolean; direction?: 'up' | 'down' }) {
    const [isOpen, setIsOpen] = useState(false);
    const { currentTheme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
    const panelRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={panelRef}>
            <Button
                variant="ghost"
                aria-label="Escolher tema visual"
                className={cn(
                    'w-full justify-start gap-3 px-4 py-3 hover:bg-primary/5 transition-all duration-300',
                    collapsed && 'justify-center px-0 h-12 w-12 min-h-[48px] min-w-[48px] md:h-11 md:w-11 rounded-xl bg-primary/10 border border-primary/20 shadow-sm'
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isDarkMode ? (
                    <Moon className="h-6 w-6 md:h-5 md:w-5 text-primary flex-shrink-0" />
                ) : (
                    <Palette className="h-6 w-6 md:h-5 md:w-5 text-primary flex-shrink-0" />
                )}
                {!collapsed && <span className="font-medium">Temas {isDarkMode ? '(Escuro)' : ''}</span>}
            </Button>

            {/* Painel de Temas */}
            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 bg-card border border-border rounded-2xl shadow-xl p-4 space-y-3 animate-in fade-in duration-200",
                        direction === 'up'
                            ? (collapsed ? "left-16 bottom-0 w-64 slide-in-from-bottom-2" : "left-0 bottom-12 w-full slide-in-from-bottom-2")
                            : "top-full right-0 mt-2 w-64 slide-in-from-top-2"
                    )}
                >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">Escolher Tema</span>
                        </div>
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border",
                                isDarkMode
                                    ? "bg-sky-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30"
                                    : "bg-slate-900 text-white border-slate-700 hover:bg-slate-800"
                            )}
                            title={isDarkMode ? "Mudar para Modo Claro" : "Ativar Modo Escuro"}
                        >
                            {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-sky-400" />}
                            {isDarkMode ? 'Claro' : 'Escuro'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {themes.map((theme) => {
                            const isActive = currentTheme.id === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        setTheme(theme.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all duration-200 group text-left",
                                        isActive
                                            ? "bg-primary/15 ring-1 ring-primary/40"
                                            : "hover:bg-muted/60"
                                    )}
                                >
                                    {/* Circulo de cor */}
                                    <div
                                        className={cn(
                                            "relative h-6 w-6 rounded-full flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110",
                                            theme.isDark && "ring-1 ring-sky-400/50"
                                        )}
                                        style={{ backgroundColor: theme.primaryHex }}
                                    >
                                        {isActive ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white drop-shadow-sm" />
                                            </div>
                                        ) : theme.id === 'modo-escuro' ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Moon className="h-3 w-3 text-sky-400" />
                                            </div>
                                        ) : null}
                                    </div>

                                    <span className={cn(
                                        "text-[10px] font-bold truncate leading-tight",
                                        isActive ? "text-primary" : "text-foreground"
                                    )}>
                                        {theme.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

