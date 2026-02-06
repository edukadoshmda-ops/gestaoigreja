import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { mockMinistries } from '@/data/mockData';
import { UserPlus } from 'lucide-react';

interface MemberFormProps {
  onSubmit: (data: MemberFormData) => void;
  onCancel: () => void;
  initialData?: MemberFormData;
}

export interface MemberFormData {
  name: string;
  birthDate: string;
  address: string;
  email: string;
  phone: string;
  ministries: string[];
}

export function MemberForm({ onSubmit, onCancel, initialData }: MemberFormProps) {
  const [formData, setFormData] = useState<MemberFormData>(initialData || {
    name: '',
    birthDate: '',
    address: '',
    email: '',
    phone: '',
    ministries: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleMinistry = (ministryId: string) => {
    setFormData(prev => ({
      ...prev,
      ministries: prev.ministries.includes(ministryId)
        ? prev.ministries.filter(m => m !== ministryId)
        : [...prev.ministries, ministryId],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {initialData ? 'Editar Membro' : 'Cadastrar Novo Membro'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ministérios</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {mockMinistries.map((ministry) => (
                <div key={ministry.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={ministry.id}
                    checked={formData.ministries.includes(ministry.id)}
                    onCheckedChange={() => toggleMinistry(ministry.id)}
                  />
                  <label htmlFor={ministry.id} className="text-sm cursor-pointer">
                    {ministry.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">{initialData ? 'Salvar Alterações' : 'Cadastrar'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
