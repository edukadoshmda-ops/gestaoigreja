import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface ThemeConfig {
    id: string;
    name: string;
    emoji: string;
    primaryHex: string;
    glowColor: string;
    hueShift: string; // Shift em graus para hue-rotate
}

export const themes: ThemeConfig[] = [
    { id: 'fe-radiante', name: 'Fé Radiante', emoji: '☀️', primaryHex: '#F97316', glowColor: 'rgba(249, 115, 22, 0.35)', hueShift: '0deg' },
    { id: 'luz-divina', name: 'Luz Divina', emoji: '✨', primaryHex: '#8B5CF6', glowColor: 'rgba(139, 92, 246, 0.35)', hueShift: '234deg' },
    { id: 'oceano-profundo', name: 'Oceano Profundo', emoji: '🌊', primaryHex: '#3B82F6', glowColor: 'rgba(59, 130, 246, 0.35)', hueShift: '193deg' },
    { id: 'jardim-eden', name: 'Jardim do Éden', emoji: '🌿', primaryHex: '#10B981', glowColor: 'rgba(16, 185, 129, 0.35)', hueShift: '136deg' },
    { id: 'rosa-saron', name: 'Rosa de Saron', emoji: '🌹', primaryHex: '#F43F5E', glowColor: 'rgba(244, 63, 94, 0.35)', hueShift: '326deg' },
    { id: 'noite-estrelada', name: 'Noite Estrelada', emoji: '🌌', primaryHex: '#1E3A8A', glowColor: 'rgba(30, 58, 138, 0.35)', hueShift: '215deg' },
    { id: 'soberania-preto', name: 'Soberania', emoji: '🖤', primaryHex: '#111111', glowColor: 'rgba(0, 0, 0, 0.35)', hueShift: '0deg' },
    { id: 'esperanca-viva', name: 'Esperança Viva', emoji: '🍃', primaryHex: '#059669', glowColor: 'rgba(5, 150, 105, 0.35)', hueShift: '150deg' },
    { id: 'acai-profundo', name: 'Açaí Profundo', emoji: '🍇', primaryHex: '#4C1D95', glowColor: 'rgba(76, 29, 149, 0.35)', hueShift: '275deg' },
    { id: 'cidade-ouro', name: 'Cidade de Ouro', emoji: '👑', primaryHex: '#B8860B', glowColor: 'rgba(184, 134, 11, 0.35)', hueShift: '22deg' },
];

interface ThemeContextType {
    currentTheme: ThemeConfig;
    setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const location = useLocation();
    const [themeId, setThemeId] = useState<string>(() => {
        const saved = localStorage.getItem('church_theme') || 'fe-radiante';
        return saved;
    });

    // Lista de páginas públicas que sempre devem usar o tema laranja
    const publicPages = ['/', '/login', '/checkout', '/hotmart-success'];
    const isPublicPage = publicPages.includes(location.pathname);
    const effectiveThemeId = isPublicPage ? 'fe-radiante' : themeId;
    const currentTheme = themes.find(t => t.id === effectiveThemeId) || themes[0];

    useEffect(() => {
        if (isPublicPage) {
            // Em páginas públicas, sempre força o tema laranja
            document.documentElement.setAttribute('data-theme', 'fe-radiante');
            document.body.setAttribute('data-theme', 'fe-radiante');
        } else {
            // Em páginas autenticadas, aplica o tema escolhido pelo usuário
            document.documentElement.setAttribute('data-theme', themeId);
            document.body.setAttribute('data-theme', themeId);
            localStorage.setItem('church_theme', themeId);
        }
    }, [themeId, location.pathname]);

    const setTheme = (id: string) => {
        setThemeId(id);
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
