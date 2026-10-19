import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeConfig {
    id: string;
    name: string;
    emoji: string;
    primaryHex: string;
    glowColor: string;
    hueShift: string; // Shift em graus para hue-rotate
    isDark?: boolean;
}

export const themes: ThemeConfig[] = [
    { id: 'modo-escuro',       name: 'Modo Escuro',       emoji: '🌙', primaryHex: '#0F172A', glowColor: 'rgba(56, 189, 248, 0.35)',  hueShift: '190deg', isDark: true },
    { id: 'ceu-azul',          name: 'Céu Azul',          emoji: '☁️', primaryHex: '#0EA5E9', glowColor: 'rgba(14, 165, 233, 0.35)', hueShift: '190deg' },
    { id: 'fe-radiante',       name: 'Fé Radiante',       emoji: '☀️', primaryHex: '#F97316', glowColor: 'rgba(249, 115, 22, 0.35)',  hueShift: '0deg'   },
    { id: 'luz-divina',        name: 'Luz Divina',        emoji: '✨', primaryHex: '#8B5CF6', glowColor: 'rgba(139, 92, 246, 0.35)', hueShift: '234deg' },
    { id: 'oceano-profundo',   name: 'Oceano Profundo',   emoji: '🌊', primaryHex: '#3B82F6', glowColor: 'rgba(59, 130, 246, 0.35)',  hueShift: '193deg' },
    { id: 'jardim-eden',       name: 'Jardim do Éden',    emoji: '🌿', primaryHex: '#10B981', glowColor: 'rgba(16, 185, 129, 0.35)', hueShift: '136deg' },
    { id: 'rosa-saron',        name: 'Rosa de Saron',     emoji: '🌹', primaryHex: '#F43F5E', glowColor: 'rgba(244, 63, 94, 0.35)',  hueShift: '326deg' },
    { id: 'noite-estrelada',   name: 'Noite Estrelada',   emoji: '🌌', primaryHex: '#1E3A8A', glowColor: 'rgba(30, 58, 138, 0.35)',  hueShift: '215deg', isDark: true },
    { id: 'soberania-preto',   name: 'Soberania',         emoji: '🖤', primaryHex: '#111111', glowColor: 'rgba(0, 0, 0, 0.35)',     hueShift: '0deg',   isDark: true },
    { id: 'esperanca-viva',    name: 'Esperança Viva',    emoji: '🍃', primaryHex: '#059669', glowColor: 'rgba(5, 150, 105, 0.35)', hueShift: '150deg' },
    { id: 'acai-profundo',     name: 'Açaí Profundo',     emoji: '🍇', primaryHex: '#4C1D95', glowColor: 'rgba(76, 29, 149, 0.35)', hueShift: '275deg' },
    { id: 'cidade-ouro',       name: 'Cidade de Ouro',    emoji: '👑', primaryHex: '#C4852A', glowColor: 'rgba(196, 133, 42, 0.35)', hueShift: '22deg'  },
];

const DARK_THEMES = new Set(['modo-escuro', 'noite-estrelada', 'soberania-preto']);

export function applyStoredThemeToDOM() {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('church_theme_v2') || 'ceu-azul';
    const savedDark = localStorage.getItem('church_dark_mode') === 'true' || DARK_THEMES.has(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    if (savedDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
    }
}

interface ThemeContextType {
    currentTheme: ThemeConfig;
    setTheme: (themeId: string) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeId, setThemeId] = useState<string>(() => {
        if (typeof window === 'undefined') return 'ceu-azul';
        return localStorage.getItem('church_theme_v2') || 'ceu-azul';
    });

    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const savedTheme = localStorage.getItem('church_theme_v2') || 'ceu-azul';
        if (DARK_THEMES.has(savedTheme)) return true;
        return localStorage.getItem('church_dark_mode') === 'true';
    });

    const currentTheme = themes.find(t => t.id === themeId) || themes[0];

    useEffect(() => {
        const publicPages = ['/', '/vendas', '/oferta', '/login', '/checkout', '/hotmart-success'];
        const isPublic = typeof window !== 'undefined' && publicPages.includes(window.location.pathname);

        localStorage.setItem('church_theme_v2', themeId);
        localStorage.setItem('church_dark_mode', String(isDarkMode));

        if (!isPublic) {
            document.documentElement.setAttribute('data-theme', themeId);
            document.body.setAttribute('data-theme', themeId);
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
            }
        }
    }, [themeId, isDarkMode]);

    const setTheme = (id: string) => {
        setThemeId(id);
        const target = themes.find(t => t.id === id);
        if (target?.isDark) {
            setIsDarkMode(true);
        } else if (DARK_THEMES.has(themeId)) {
            setIsDarkMode(false);
        }
    };

    const toggleDarkMode = () => {
        if (!isDarkMode) {
            setIsDarkMode(true);
            if (!DARK_THEMES.has(themeId) && themeId === 'ceu-azul') {
                setThemeId('modo-escuro');
            }
        } else {
            setIsDarkMode(false);
            if (DARK_THEMES.has(themeId)) {
                setThemeId('ceu-azul');
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme, isDarkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}

