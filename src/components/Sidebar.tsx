import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Church,
  Calendar,
  FileText,
  Upload,
  MapPin,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio'] },
  { icon: Users, label: 'Membros', href: '/membros', roles: ['admin', 'secretario'] },
  { icon: Church, label: 'Ministérios', href: '/ministerios', roles: ['admin', 'secretario', 'tesoureiro', 'membro', 'lider_ministerio'] },
  { icon: MapPin, label: 'Células', href: '/celulas', roles: ['admin', 'secretario', 'membro', 'lider_celula'] },
  { icon: Calendar, label: 'Eventos', href: '/eventos', roles: ['admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio'] },
  { icon: DollarSign, label: 'Caixa Diário', href: '/caixa-diario', roles: ['admin', 'tesoureiro'] },
  { icon: FileText, label: 'Relatórios', href: '/relatorios', roles: ['admin', 'tesoureiro'] },
  { icon: Upload, label: 'Uploads', href: '/uploads', roles: ['admin', 'secretario', 'tesoureiro'] },
  { icon: Settings, label: 'Institucional', href: '/institucional', roles: ['admin'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        'bg-card h-full flex flex-col transition-all duration-300 border-r border-border/50 shadow-lg',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        {!collapsed && <Logo size="sm" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hover:bg-primary/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-3 space-y-2">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium',
                isActive
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg scale-105'
                  : 'text-foreground hover:bg-primary/5 hover:scale-102 hover:shadow-sm'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50">
        {!collapsed && user && (
          <div className="px-4 py-3 mb-2 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize mt-1">{user.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn('w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-all', collapsed && 'justify-center')}
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
