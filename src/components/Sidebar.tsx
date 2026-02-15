import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Camera, Loader2 } from 'lucide-react';
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
  BarChart3,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { NotificationCenter } from './NotificationCenter';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: UserRole[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const dashboardItem: NavItem = {
  icon: LayoutDashboard,
  label: 'Dashboard',
  href: '/dashboard',
  roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'],
};

const navGroups: NavGroup[] = [
  {
    title: 'Membros e congregados',
    items: [
      { icon: Users, label: 'Membros e Congregados', href: '/membros', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
      { icon: Settings, label: 'Configurações', href: '/institucional', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
    ],
  },
  {
    title: 'Ministério',
    items: [
      { icon: Church, label: 'Ministérios', href: '/ministerios', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
      { icon: MapPin, label: 'Células', href: '/celulas', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
      { icon: Heart, label: 'Discipulado', href: '/discipulado', roles: ['admin', 'pastor', 'secretario', 'lider_celula', 'superadmin'] },
    ],
  },
  {
    title: 'Administrativo e financeiro',
    items: [
      { icon: FileText, label: 'Secretaria', href: '/secretaria', roles: ['admin', 'pastor', 'secretario', 'superadmin'] },
      { icon: BarChart3, label: 'Relatórios', href: '/relatorios', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'lider_celula', 'lider_ministerio', 'superadmin'] },
      { icon: Upload, label: 'Uploads e Atas', href: '/uploads', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
    ],
  },
  {
    title: 'Tesouraria',
    items: [
      { icon: DollarSign, label: 'Caixa Diário', href: '/caixa-diario', roles: ['admin', 'pastor', 'tesoureiro', 'superadmin'] },
    ],
  },
];

const otherItems: NavItem[] = [
  { icon: Calendar, label: 'Eventos', href: '/eventos', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: ShieldCheck, label: 'Painel Root', href: '/superadmin', roles: ['superadmin'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, updateAvatar } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const canSee = (item: NavItem) => user && item.roles.includes(user.role);
  const filteredGroups = navGroups.map((grp) => ({
    ...grp,
    items: grp.items.filter(canSee),
  })).filter((grp) => grp.items.length > 0);
  const filteredOther = otherItems.filter(canSee);
  const showDashboard = canSee(dashboardItem);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('church-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('church-documents')
        .getPublicUrl(filePath);

      updateAvatar(publicUrl);
      toast({
        title: 'Foto de perfil atualizada!',
        description: 'Sua nova foto foi salva com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar foto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <aside
      className={cn(
        'bg-card h-full flex flex-col transition-all duration-300 border-r border-border/50 shadow-lg',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        {!collapsed && <Logo size="sm" />}
        <div className="flex items-center gap-1 ml-auto">
          {!collapsed && <NotificationCenter />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-primary/10 min-h-[44px] min-w-[44px]"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-3 overflow-y-auto" translate="no">
        {showDashboard && (
          <Link
            to={dashboardItem.href}
            className={cn(
              'flex items-center gap-4 px-4 min-h-[48px] py-3.5 rounded-xl transition-all duration-300 font-medium active:scale-[0.98]',
              location.pathname === dashboardItem.href
                ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
                : 'text-foreground hover:bg-primary/5 hover:shadow-sm'
            )}
          >
            <dashboardItem.icon className={cn(
              'h-6 w-6 flex-shrink-0',
              location.pathname !== dashboardItem.href && 'text-primary'
            )} />
            {!collapsed && <span className="text-[15px]">{dashboardItem.label}</span>}
          </Link>
        )}
        {filteredGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-4 px-4 min-h-[48px] py-3.5 rounded-xl transition-all duration-300 font-medium active:scale-[0.98]',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
                      : 'text-foreground hover:bg-primary/5 hover:shadow-sm'
                  )}
                >
                  <item.icon className={cn(
                    'h-6 w-6 flex-shrink-0',
                    !isActive && 'text-primary'
                  )} />
                  {!collapsed && <span className="text-[15px]">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
        {filteredOther.length > 0 && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Outros
              </p>
            )}
            {filteredOther.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-4 px-4 min-h-[48px] py-3.5 rounded-xl transition-all duration-300 font-medium active:scale-[0.98]',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
                      : 'text-foreground hover:bg-primary/5 hover:shadow-sm'
                  )}
                >
                  <item.icon className={cn(
                    'h-6 w-6 flex-shrink-0',
                    !isActive && 'text-primary'
                  )} />
                  {!collapsed && <span className="text-[15px]">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-2">
        {/* Seletor de Temas */}
        <ThemeSwitcher collapsed={collapsed} />

        <input
          type="file"
          ref={avatarInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleAvatarUpload}
        />
        {!collapsed && user && (
          <div className="px-4 py-3 mb-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 relative group">
            <div
              className="relative cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleAvatarClick}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border-2 border-primary/50 shadow-sm"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
            <div className="min-w-0" translate="no">
              <p className="font-semibold text-sm truncate"><span>{user.name}</span></p>
              <p className="text-xs text-muted-foreground capitalize truncate"><span>{user.role}</span></p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn('w-full justify-start min-h-[48px] hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98]', collapsed && 'justify-center')}
          onClick={logout}
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          {!collapsed && <span className="ml-3 text-[15px]">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
