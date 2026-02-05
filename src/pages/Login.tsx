import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import heroImage from '@/assets/sky-landscape.png';

export default function Login() {
  const [role, setRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    login(email, password, role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Céu"
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Card */}
        <Card className="shadow-sm">
          <CardContent className="p-6">

            {/* Logo */}
            <div className="flex justify-center mb-2">
              <Logo showText={false} size="md" />
            </div>

            {/* Título organizado */}
            <h1 className="text-2xl font-bold text-center mb-1">
              <span className="text-slate-900">Gestão</span>{' '}
              <span className="text-primary">Igreja</span>
            </h1>

            <h2 className="text-lg font-semibold text-center mb-1 mt-4">
              Acessar sistema
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Entre com seus dados para continuar
            </p>

            {/* Perfis */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <RoleButton
                icon={<Shield size={16} />}
                label="Administrador"
                active={role === 'admin'}
                onClick={() => setRole('admin')}
              />
              <RoleButton
                icon={<User size={16} />}
                label="Secretário(a)"
                active={role === 'secretario'}
                onClick={() => setRole('secretario')}
              />
              <RoleButton
                icon={<Briefcase size={16} />}
                label="Tesoureiro(a)"
                active={role === 'tesoureiro'}
                onClick={() => setRole('tesoureiro')}
              />
              <RoleButton
                icon={<Users size={16} />}
                label="Membro"
                active={role === 'membro'}
                onClick={() => setRole('membro')}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Error Message */}
              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">
                Entrar
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Demo: use qualquer e-mail e senha com 4+ caracteres
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Botão de perfil */
function RoleButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition
        ${active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-muted hover:bg-muted'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
