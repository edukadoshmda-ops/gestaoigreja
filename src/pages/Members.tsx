import { useState, useEffect } from 'react';
import { Plus, Loader2, Cake, Users as UsersIcon, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { MemberList } from '@/components/MemberList';
import { MemberForm, MemberFormData } from '@/components/MemberForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Member } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { membersService } from '@/services/members.service';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function Members() {
  useDocumentTitle('Membros');
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, churchId, viewingChurch } = useAuth();
  // Prioriza o churchId do contexto (atualizado quando superadmin visualiza uma igreja)
  // Se não houver, usa o churchId do usuário
  const effectiveChurchId = churchId || user?.churchId;

  useEffect(() => {
    loadMembers();
  }, [effectiveChurchId, viewingChurch?.id]);

  async function loadMembers() {
    try {
      setError(null);
      setLoading(true);
      const data = await membersService.getAll(effectiveChurchId);
      // Map DB snake_case to Frontend camelCase
      const mappedMembers: Member[] = (data || []).map((m: any) => ({
        id: m.id,
        churchId: m.church_id || '',
        name: m.name,
        email: m.email || '',
        phone: m.phone || '',
        birthDate: m.birth_date || '',
        maritalStatus: m.marital_status || 'solteiro',
        address: m.address || '',
        photoUrl: m.photo_url || '',
        category: m.status === 'visitante' ? 'congregado' : 'membro',
        createdAt: m.created_at,
      }));
      setMembers(mappedMembers);
    } catch (err: any) {
      console.error('Erro ao carregar membros:', err);
      setMembers([]);
      const msg = err?.message || '';
      const isSessionOrPerm = /session|permission|RLS|401|403|PGRST/i.test(msg) || msg.includes('fetch');
      setError(isSessionOrPerm ? 'Sessão expirada ou sem permissão.' : (msg || 'Não foi possível carregar.'));
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de membros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleAddMember = async (data: MemberFormData) => {
    try {
      if (editingMember) {
        await membersService.update(editingMember.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          birth_date: data.birthDate,
          marital_status: data.maritalStatus as any,
          address: data.address,
          photo_url: data.photoUrl,
          status: data.category === 'congregado' ? 'visitante' : 'ativo',
        });


        toast({
          title: 'Cadastro atualizado!',
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        const cid = effectiveChurchId;
        if (!cid) throw new Error('Selecione uma igreja no Painel Root ou faça login em uma igreja.');

        await membersService.create({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          birth_date: data.birthDate || null,
          marital_status: data.maritalStatus as any,
          address: data.address || null,
          photo_url: data.photoUrl || null,
          status: data.category === 'congregado' ? 'visitante' : 'ativo',
        }, cid);

        toast({
          title: 'Membro cadastrado!',
          description: `${data.name} foi adicionado com sucesso.`,
        });
      }
      setShowForm(false);
      setEditingMember(null);
      loadMembers(); // Reload list
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao tentar salvar os dados. Verifique sua permissão ou conexão.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await membersService.delete(id);
      setMembers(members.filter(m => m.id !== id));
      toast({
        title: 'Membro removido',
        description: 'O membro foi excluído do sistema.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o membro.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membros e Congregados</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da igreja
          </p>
        </div>
        {!showForm && (user?.role === 'superadmin' || (user?.role !== 'aluno' && user?.role !== 'membro' && user?.role !== 'congregado' && user?.role !== 'tesoureiro')) && (
          <Button onClick={() => { setEditingMember(null); setShowForm(true); }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Membro
          </Button>
        )}
      </div>

      {showForm ? (
        <MemberForm
          onSubmit={handleAddMember}
          onCancel={() => { setShowForm(false); setEditingMember(null); }}
          initialData={editingMember || undefined}
        />
      ) : error && members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => loadMembers()}>Tentar novamente</Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="todos" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="todos" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="aniversariantes" className="gap-2 relative">
              <Cake className="h-4 w-4" />
              Aniversariantes
              {members.filter(m => {
                if (!m.birthDate) return false;
                const mIdx = new Date(m.birthDate).getMonth() + 1;
                return mIdx === (new Date().getMonth() + 1);
              }).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos">
            <MemberList
              members={members}
              onDelete={handleDeleteMember}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="aniversariantes">
            <MemberList
              members={members.filter(m => {
                if (!m.birthDate) return false;
                const birthMonth = new Date(m.birthDate).getMonth() + 1;
                const todayMonth = new Date().getMonth() + 1;
                return birthMonth === todayMonth;
              }).sort((a, b) => {
                const dayA = new Date(a.birthDate).getDate();
                const dayB = new Date(b.birthDate).getDate();
                return dayA - dayB;
              })}
              onDelete={handleDeleteMember}
              onEdit={handleEdit}
            />
            {members.filter(m => {
              if (!m.birthDate) return false;
              return (new Date(m.birthDate).getMonth() + 1) === (new Date().getMonth() + 1);
            }).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                  <Cake className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum aniversariante neste mês.</p>
                </div>
              )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
