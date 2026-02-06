import { useNavigate } from 'react-router-dom';
import { MemberForm, MemberFormData } from '@/components/MemberForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { membersService } from '@/services/members.service';

export default function Registration() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const handleRegistrationSubmit = async (data: MemberFormData) => {
        try {
            // Save member to Supabase with null for empty strings
            await membersService.create({
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                birth_date: data.birthDate || null,
                address: data.address || null,
                status: 'ativo',
            });

            toast({
                title: 'Cadastro Realizado!',
                description: `Seja bem-vindo, ${data.name}! Seu perfil foi criado e salvo com sucesso.`,
            });

            // After registration, go to the dashboard (painel)
            navigate('/dashboard');
        } catch (error) {
            console.error('Erro ao realizar cadastro:', error);
            toast({
                title: 'Erro ao salvar',
                description: 'Não conseguimos salvar seus dados. Verifique sua conexão e tente novamente.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black tracking-tight mb-2">Complete seu Cadastro</h1>
                <p className="text-muted-foreground">Precisamos de mais algumas informações para seu acesso ao painel.</p>
            </div>

            <MemberForm
                onSubmit={handleRegistrationSubmit}
                onCancel={() => navigate('/login')}
            />
        </div>
    );
}
