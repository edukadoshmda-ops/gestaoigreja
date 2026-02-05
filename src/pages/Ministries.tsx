import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sidebar } from '@/components/Sidebar';
import { MinistryCard } from '@/components/MinistryCard';
import { mockMinistries as initialMinistries } from '@/data/mockData';
import { Ministry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function Ministries() {
  const [ministries, setMinistries] = useState<Ministry[]>(initialMinistries);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMinistry, setNewMinistry] = useState({ name: '', description: '' });
  const { toast } = useToast();
  const { user } = useAuth();
  const canCreate = user?.role === 'admin';

  const handleCreateMinistry = () => {
    if (!newMinistry.name || !newMinistry.description) return;

    const ministry: Ministry = {
      id: newMinistry.name.toLowerCase().replace(/\s/g, '-'),
      name: newMinistry.name,
      description: newMinistry.description,
      icon: 'Church',
      memberCount: 0,
    };

    setMinistries([...ministries, ministry]);
    setNewMinistry({ name: '', description: '' });
    setDialogOpen(false);
    toast({
      title: 'Ministério criado!',
      description: `${ministry.name} foi adicionado com sucesso.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ministérios</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie os ministérios da igreja
          </p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo Ministério
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Ministério</DialogTitle>
                <DialogDescription>
                  Adicione um novo ministério à igreja
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ministry-name">Nome</Label>
                  <Input
                    id="ministry-name"
                    value={newMinistry.name}
                    onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
                    placeholder="Ex: Casais"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ministry-desc">Descrição</Label>
                  <Input
                    id="ministry-desc"
                    value={newMinistry.description}
                    onChange={(e) => setNewMinistry({ ...newMinistry, description: e.target.value })}
                    placeholder="Breve descrição do ministério"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateMinistry}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ministries.map((ministry) => (
          <MinistryCard key={ministry.id} ministry={ministry} />
        ))}
      </div>
    </div>
  );
}
