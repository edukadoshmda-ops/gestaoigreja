import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Logo } from './Logo';
import { NotificationCenter } from './NotificationCenter';
import { ThemeSwitcher } from './ThemeSwitcher';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [open, setOpen] = useState(false);
    console.log('MainLayout: Rendering children', children ? 'exists' : 'null');

    return (
        <div className="flex min-h-screen bg-background" translate="no">
            {/* Desktop Sidebar - Shown ONLY on large screens (PC > 1024px) */}
            <div className="hidden lg:flex print:hidden border-r border-border bg-card">
                <Sidebar />
            </div>

            {/* Mobile & Tablet Layout - Header always visible below 1024px */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card print:hidden">
                    <Logo size="sm" />
                    <div className="flex items-center gap-2">
                        <ThemeSwitcher collapsed={true} />
                        <NotificationCenter />
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11 shadow-sm border border-border/50 bg-background/50">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-[300px] border-r-0">
                                <div className="h-full" onClick={() => setOpen(false)}>
                                    <Sidebar />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
