import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Logo } from './Logo';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar - Hidden on mobile/tablet */}
            <div className="hidden lg:flex print:hidden">
                <Sidebar />
            </div>

            {/* Mobile/Tablet Header & Sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card print:hidden">
                    <Logo size="sm" />
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 border-r-0">
                            <div className="h-full" onClick={() => setOpen(false)}>
                                <Sidebar />
                            </div>
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
