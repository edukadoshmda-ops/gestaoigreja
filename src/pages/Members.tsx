import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { MemberList } from '@/components/MemberList';
import { MemberForm, MemberFormData } from '@/components/MemberForm';
import { mockMembers as initialMembers } from '@/data/mockData';
import { Member } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Members() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const handleAddMember = (data: MemberFormData) => {
    const newMember: Member = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setMembers([...members, newMember]);
    setShowForm(false);
    toast({
      title: 'Membro cadastrado!',
      description: `${data.name} foi adicionado com sucesso.`,
    });
  };

  const handleDeleteMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast({
      title: 'Membro removido',
      description: 'O membro foi excluído do sistema.',
      variant: 'destructive',
    });
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
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Membro
          </Button>
        )}
      </div>

      {showForm ? (
        <MemberForm onSubmit={handleAddMember} onCancel={() => setShowForm(false)} />
      ) : (
        <MemberList members={members} onDelete={handleDeleteMember} />
      )}
    </div>
  );
}
