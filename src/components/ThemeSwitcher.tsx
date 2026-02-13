import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, themes } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ collapsed }: { collapsed: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const { currentTheme, setTheme } = useTheme();
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
                className={cn(
                    'w-full justify-start gap-3 px-4 py-3 hover:bg-primary/5 transition-all duration-300',
                    collapsed && 'justify-center px-0'
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Palette className="h-5 w-5 text-primary flex-shrink-0" />
                {!collapsed && <span className="font-medium">Temas</span>}
            </Button>

            {/* Painel de Temas */}
            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 bg-card border border-border rounded-2xl shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200",
                        collapsed
                            ? "left-16 bottom-0 w-56"
                            : "left-0 bottom-12 w-full"
                    )}
                >
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Palette className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">Escolher Tema</span>
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
                                            ? "bg-primary/15 ring-1 ring-primary/30"
                                            : "hover:bg-muted/60"
                                    )}
                                >
                                    {/* Circulo de cor */}
                                    <div
                                        className="relative h-6 w-6 rounded-full flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110"
                                        style={{ backgroundColor: theme.primaryHex }}
                                    >
                                        {isActive && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white drop-shadow-sm" />
                                            </div>
                                        )}
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
