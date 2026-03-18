import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Camera, Loader2 } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  BookOpen,
  Share2,
  DollarSign,
  CreditCard,
  FileText,
  MapPin,
  GraduationCap,
  Package,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: UserRole[];
  /** Abre em nova aba (ex: link de cadastro trial) */
  openInNewTab?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const dashboardItem: NavItem = {
  icon: LayoutDashboard,
  label: 'Dashboard',
  href: '/dashboard',
  roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'],
};

const navGroups: NavGroup[] = [
  {
    title: '',
    items: [
      { icon: Users, label: 'Membros e Congregados', href: '/membros', roles: ['pastor', 'secretario', 'superadmin'] },
      { icon: Send, label: 'Boletins e Avisos', href: '/boletins', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
      { icon: BookOpen, label: 'Planos de Leitura', href: '/planos-leitura', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
      { icon: Package, label: 'Patrimonial', href: '/patrimonio', roles: ['admin', 'pastor', 'superadmin', 'diretor_patrimonio'] },
      { icon: Share2, label: 'Redes Sociais', href: '/redes-sociais', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
      { icon: CreditCard, label: 'Doar dízimos e ofertas', href: '/pix-donacoes', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
      { icon: CreditCard, label: 'Ativar pagamentos', href: '/dashboard/pagamentos', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'superadmin'] },
      { icon: Gift, label: 'Cadastrar Igreja - Teste 30 dias', href: '/cadastro-igreja-trial', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'], openInNewTab: true },
    ],
  },
];

const otherItems: NavItem[] = [
  { icon: ShieldCheck, label: 'Painel Root', href: '/superadmin', roles: ['superadmin'] },
];

// Função para formatar o role para exibição
const formatRole = (role: string | undefined): string => {
  if (!role) return '';
  const roleLower = role.toLowerCase();
  if (roleLower === 'superadmin') return 'Super Admin';
  if (roleLower === 'lider_celula') return 'Líder Célula';
  if (roleLower === 'lider_ministerio') return 'Líder Ministério';
  // Capitaliza a primeira letra e mantém o resto
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateAvatar } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Tesoureiro, secretário e diretor de patrimônio veem todos os itens da sidebar (exceto Painel Root)
  const rolesQueVeemTudoSidebar = ['tesoureiro', 'secretario', 'diretor_patrimonio'];
  const canSee = (item: NavItem) => {
    if (!user) return false;
    if (item.href === '/superadmin') return user.role === 'superadmin';
    if (rolesQueVeemTudoSidebar.includes(user.role ?? '')) return true;
    return item.roles.includes(user.role);
  };
  const filteredGroups = navGroups.map((grp) => ({
    ...grp,
    items: grp.items.filter(canSee),
  })).filter((grp) => grp.items.length > 0);
  const filteredOther = otherItems.filter(canSee);
  const showDashboard = canSee(dashboardItem);

  // Garantir que superadmin sempre veja o Painel Root
  const isSuperAdmin = user?.role === 'superadmin';

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

      await updateAvatar(publicUrl);
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
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          {/* Logo */}
          <div className={cn('flex flex-col items-center gap-0 min-w-0 flex-1', collapsed && 'flex-none')}>
            <div className={cn('origin-center', collapsed ? 'scale-[1.05]' : 'scale-[1.05]')}>
              <Logo size="sm" showText={false} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-primary/10 min-h-[44px] min-w-[44px] shrink-0"
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
            {!collapsed && <span className="text-[12px]">{dashboardItem.label}</span>}
          </Link>
        )}
        {filteredGroups.map((group, idx) => (
          <div key={group.title || `nav-group-${idx}`} className="space-y-1">
            {!collapsed && group.title && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = !item.openInNewTab && location.pathname === item.href;
              const className = cn(
                'flex items-center gap-4 px-4 min-h-[48px] py-3.5 rounded-xl transition-all duration-300 font-medium active:scale-[0.98]',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
                  : 'text-foreground hover:bg-primary/5 hover:shadow-sm'
              );
              if (item.openInNewTab) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    <item.icon className={cn('h-6 w-6 flex-shrink-0', 'text-primary')} />
                    {!collapsed && <span className="text-[12px]">{item.label}</span>}
                  </a>
                );
              }
              return (
                <Link key={item.href} to={item.href} className={className}>
                  <item.icon className={cn(
                    'h-6 w-6 flex-shrink-0',
                    !isActive && 'text-primary'
                  )} />
                  {!collapsed && <span className="text-[12px]">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
        {(filteredOther.length > 0 || isSuperAdmin) && (
          <div className="space-y-1">
            {/* Sempre mostrar Painel Root para superadmin */}
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/superadmin')}
                className={cn(
                  'flex items-center gap-4 px-4 min-h-[48px] py-3.5 rounded-xl transition-all duration-300 font-medium active:scale-[0.98] w-full text-left cursor-pointer',
                  location.pathname === '/superadmin'
                    ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
                    : 'text-foreground hover:bg-primary/5 hover:shadow-sm'
                )}
              >
                <ShieldCheck className={cn(
                  'h-6 w-6 flex-shrink-0',
                  location.pathname !== '/superadmin' && 'text-primary'
                )} />
                {!collapsed && <span className="text-[12px]">Painel Root</span>}
              </button>
            )}
            {/* Outros itens filtrados */}
            {filteredOther.filter(item => item.href !== '/superadmin' || !isSuperAdmin).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    'flex items-center gap-4 px-4 min-h-[48px] py-3.5 rounded-xl transition-all duration-300 font-medium active:scale-[0.98] w-full text-left cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
                      : 'text-foreground hover:bg-primary/5 hover:shadow-sm'
                  )}
                >
                  <item.icon className={cn(
                    'h-6 w-6 flex-shrink-0',
                    !isActive && 'text-primary'
                  )} />
                  {!collapsed && <span className="text-[12px]">{item.label}</span>}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-2">
        {/* Seletor de Temas */}
        <div data-onboarding-themes>
          <ThemeSwitcher collapsed={collapsed} />
        </div>

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
              <p className="text-xs text-muted-foreground truncate">
                <span>{formatRole(user?.role || '')}</span>
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn('w-full justify-start min-h-[48px] hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98]', collapsed && 'justify-center')}
          onClick={logout}
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          {!collapsed && <span className="ml-3 text-[12px]">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
