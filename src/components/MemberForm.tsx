import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Camera, Upload, Loader2, UserCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface MemberFormProps {
  onSubmit: (data: MemberFormData) => void;
  onCancel: () => void;
  initialData?: MemberFormData;
}

export interface MemberFormData {
  name: string;
  birthDate: string;
  maritalStatus: string;
  address: string;
  email: string;
  phone: string;
  category: 'membro' | 'congregado';
  photoUrl?: string;
}

export function MemberForm({ onSubmit, onCancel, initialData }: MemberFormProps) {
  const [formData, setFormData] = useState<MemberFormData>(initialData || {
    name: '',
    birthDate: '',
    maritalStatus: 'solteiro',
    address: '',
    email: '',
    phone: '',
    category: 'membro',
    photoUrl: '',
  });

  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };


  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `members/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('church-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('church-documents')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photoUrl: publicUrl });
      toast({
        title: 'Foto carregada!',
        description: 'A foto do membro foi processada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative group">
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  className="h-32 w-32 rounded-full object-cover border-4 border-primary/20 shadow-xl"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center border-4 border-dashed border-primary/20">
                  <UserCircle className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Foto do Membro</p>
          </div>

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
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Estado Civil</Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value: any) => setFormData({ ...formData, maritalStatus: value })}
              >
                <SelectTrigger id="maritalStatus">
                  <SelectValue placeholder="Selecione o estado civil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="congregado">Congregado</SelectItem>
                </SelectContent>
              </Select>
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
