import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { MemberList } from '@/components/MemberList';
import { MemberForm, MemberFormData } from '@/components/MemberForm';
import { Member } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { membersService } from '@/services/members.service';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      const data = await membersService.getAll();
      // Map DB snake_case to Frontend camelCase
      const mappedMembers: Member[] = (data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email || '',
        phone: m.phone || '',
        birthDate: m.birth_date || '',
        address: m.address || '',
        ministries: [],
        createdAt: m.created_at,
      }));
      setMembers(mappedMembers);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
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
          address: data.address,
        });
        toast({
          title: 'Cadastro atualizado!',
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        await membersService.create({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          birth_date: data.birthDate || null,
          address: data.address || null,
          status: 'ativo',
        });
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
          <h1 className="text-3xl font-bold tracking-tight">Membros</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da igreja
          </p>
        </div>
        {!showForm && (
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
      ) : (
        <MemberList
          members={members}
          onDelete={handleDeleteMember}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
