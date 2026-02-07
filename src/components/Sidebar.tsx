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
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado'] },
  { icon: Users, label: 'Membros e Congregados', href: '/membros', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado'] },
  { icon: Church, label: 'Ministérios', href: '/ministerios', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado'] },
  { icon: MapPin, label: 'Células', href: '/celulas', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado'] },
  { icon: Calendar, label: 'Eventos', href: '/eventos', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado'] },
  { icon: DollarSign, label: 'Caixa Diário', href: '/caixa-diario', roles: ['admin', 'pastor', 'tesoureiro'] },
  { icon: FileText, label: 'Relatórios', href: '/relatorios', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'lider_celula', 'lider_ministerio'] },
  { icon: Upload, label: 'Uploads', href: '/uploads', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado'] },
  { icon: FileText, label: 'Secretaria', href: '/secretaria', roles: ['admin', 'pastor', 'secretario'] },
  { icon: Settings, label: 'Institucional', href: '/institucional', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, updateAvatar } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const filteredItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

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
        <input
          type="file"
          ref={avatarInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleAvatarUpload}
        />
        {!collapsed && user && (
          <div className="px-4 py-3 mb-2 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 flex items-center gap-3 relative group">
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
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user.role}</p>
            </div>
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
