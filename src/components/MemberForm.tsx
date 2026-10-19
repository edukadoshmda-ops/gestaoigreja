import { useState, useRef } from 'react';
import {
  UserPlus,
  Camera,
  Loader2,
  Trash2,
  Edit2,
  Bell,
  RefreshCw,
  Share2,
  Folder,
  Check,
  Church,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
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
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { maskPhone, maskCPF, unmask } from '@/lib/masks';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

export interface MemberFormData {
  name: string;
  birthDate: string;
  maritalStatus: string;
  address: string;
  email: string;
  phone: string;
  category: 'membro' | 'congregado';
  photoUrl?: string;
  churchName?: string;

  // Campos do novo modelo de cadastro:
  prefix?: string;
  nickname?: string;
  gender?: string;
  organDonor?: string;
  nationality?: string;
  education?: string;
  profession?: string;
  bloodType?: string;
  specialNeeds?: string;
  cpf?: string;
  rg?: string;
  passport?: string;
  motherName?: string;
  fatherName?: string;
  registrationUpdatedAt?: string;
  status?: string;
  role?: string;
  baptismDate?: string;
}

interface MemberFormProps {
  onSubmit: (data: MemberFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<MemberFormData>;
  churchName?: string;
  pastorName?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  isPublicForm?: boolean;
}

export function MemberForm({
  onSubmit,
  onCancel,
  initialData,
  churchName,
  pastorName,
  isSubmitting,
  disabled,
  isPublicForm = false,
}: MemberFormProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<MemberFormData>({
    name: initialData?.name || '',
    birthDate: initialData?.birthDate || '',
    maritalStatus: initialData?.maritalStatus || 'casado',
    address: initialData?.address || '',
    email: initialData?.email || '',
    phone: initialData?.phone ? maskPhone(initialData.phone) : '',
    category: initialData?.category || 'membro',
    photoUrl: initialData?.photoUrl || '',
    churchName: initialData?.churchName || churchName || '',

    // Novos campos da referência visual:
    prefix: initialData?.prefix || '',
    nickname: initialData?.nickname || '',
    gender: initialData?.gender || 'feminino',
    organDonor: initialData?.organDonor || 'Não',
    nationality: initialData?.nationality || 'Brasileira',
    education: initialData?.education || 'medio',
    profession: initialData?.profession || '',
    bloodType: initialData?.bloodType || 'selecione',
    specialNeeds: initialData?.specialNeeds || 'Não',
    cpf: initialData?.cpf ? maskCPF(initialData.cpf) : '',
    rg: initialData?.rg || '',
    passport: initialData?.passport || '',
    motherName: initialData?.motherName || '',
    fatherName: initialData?.fatherName || '',
    registrationUpdatedAt: initialData?.registrationUpdatedAt || todayStr,
    status: initialData?.status || 'Disponível',
    role: initialData?.role || 'Membro',
    baptismDate: initialData?.baptismDate || '',
  });

  const [uploading, setUploading] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(Boolean(isPublicForm));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const optimized = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.78 });
      const fileExt = (optimized instanceof File ? optimized.name : file.name).split('.').pop();
      const filePath = `members/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('church-documents')
        .upload(filePath, optimized, {
          cacheControl: STORAGE_CACHE_CONTROL,
          contentType: optimized.type || file.type,
        });

      if (uploadError) {
        // Fallback para formulário público (sem sessão autenticada): converte imagem já comprimida para Data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Falha ao processar foto'));
          reader.readAsDataURL(optimized);
        });
        setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from('church-documents').getPublicUrl(filePath);
        setFormData((prev) => ({ ...prev, photoUrl: publicUrl }));
      }

      toast({
        title: 'Foto carregada!',
        description: 'A foto foi processada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível carregar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome completo do membro.',
        variant: 'destructive',
      });
      return;
    }

    onSubmit({
      ...formData,
      phone: unmask(formData.phone),
      cpf: unmask(formData.cpf || ''),
    });
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">
              {isPublicForm
                ? 'Ficha Cadastral de Membro'
                : initialData?.name
                  ? 'Editar Cadastro de Membro'
                  : 'Novo Cadastro de Membro'}
            </span>
          </div>
          {(churchName || formData.churchName) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
              <Church className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{churchName || formData.churchName}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input oculto para carregar arquivo de foto */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
          />

          {/* Grid Principal: Foto & Status à esquerda + Formulário da referência à direita */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* ================= COLUNA ESQUERDA: FOTO E STATUS (3 colunas) ================= */}
            <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center gap-4">
              {/* Badges de Ação do Topo (Ocultos no formulário público enviado aos membros) */}
              {!isPublicForm && (
                <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border w-full justify-between">
                  <button
                    type="button"
                    title="Notificações"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-background text-[11px] font-semibold border hover:bg-muted text-amber-600 transition"
                  >
                    <Bell className="h-3 w-3" />
                    <span>6</span>
                  </button>
                  <button
                    type="button"
                    title="Atualizações"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-background text-[11px] font-semibold border hover:bg-muted text-blue-600 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>1</span>
                  </button>
                  <button
                    type="button"
                    title="Vínculos"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-background text-[11px] font-semibold border hover:bg-muted text-emerald-600 transition"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>3</span>
                  </button>
                  <button
                    type="button"
                    title="Documentos"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-background text-[11px] font-semibold border hover:bg-muted text-purple-600 transition"
                  >
                    <Folder className="h-3 w-3" />
                    <span>3</span>
                  </button>
                </div>
              )}

              {/* Card da Foto Principal */}
              <div className="w-full aspect-[4/5] max-w-[220px] rounded-2xl border-2 border-border/80 bg-muted/30 relative overflow-hidden shadow-md flex items-center justify-center group">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Foto do membro"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                    <Camera className="h-12 w-12 stroke-[1.5] mb-2 opacity-50" />
                    <span className="text-xs font-semibold">Sem Foto</span>
                    <span className="text-[10px] text-muted-foreground/80">Clique no lápis para enviar</span>
                  </div>
                )}

                {/* Loading de Upload */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs font-medium">Enviando...</span>
                  </div>
                )}

                {/* Botões no Canto Inferior Esquerdo (Lápis Ciano / Lixeira Vermelha) */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Editar / Alterar Foto"
                    className="h-8 w-8 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Excluir Foto"
                      className="h-8 w-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Mini Avatar no Canto Inferior Direito */}
                <div className="absolute bottom-2.5 right-2.5 z-10">
                  <div className="h-9 w-9 rounded-full border-2 border-white bg-background overflow-hidden shadow-md flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Mini avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {(formData.name || 'M').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seletor de Status (Conforme referência visual: "Status: ☑️ Disponível") */}
              <div className="w-full max-w-[220px] space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold text-muted-foreground uppercase">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="status" className="w-full h-9 bg-background font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                        <span>Disponível</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Ativo">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Ativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Em Observação">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Em Observação</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Ausente">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>Ausente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Transferido">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        <span>Transferido</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Inativo">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span>Inativo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ================= COLUNA DIREITA: FORMULÁRIO EM GRADE (9 colunas) ================= */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4">
              {/* LINHA 1: Prefixo, Nome, Apelido */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-3 lg:col-span-2 space-y-1">
                  <Label htmlFor="prefix" className="text-xs font-bold text-muted-foreground">
                    Prefixo
                  </Label>
                  <Input
                    id="prefix"
                    value={formData.prefix || ''}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    placeholder="Pr., Ev., Ir."
                    className="h-9"
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 lg:col-span-7 space-y-1">
                  <Label htmlFor="name" className="text-xs font-bold text-muted-foreground">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo do membro"
                    required
                    className="h-9 font-medium"
                  />
                </div>

                <div className="col-span-12 sm:col-span-3 lg:col-span-3 space-y-1">
                  <Label htmlFor="nickname" className="text-xs font-bold text-muted-foreground">
                    Apelido
                  </Label>
                  <Input
                    id="nickname"
                    value={formData.nickname || ''}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Como é conhecido"
                    className="h-9"
                  />
                </div>
              </div>

              {/* LINHA 2: Data de nascimento, Gênero, Doador de órgãos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="birthDate" className="text-xs font-bold text-muted-foreground">
                    Data de nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="gender" className="text-xs font-bold text-muted-foreground">
                    Gênero <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => setFormData({ ...formData, gender: val })}
                  >
                    <SelectTrigger id="gender" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feminino">🚺 Feminino</SelectItem>
                      <SelectItem value="masculino">🚹 Masculino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="organDonor" className="text-xs font-bold text-muted-foreground">
                    Doador de órgãos
                  </Label>
                  <Select
                    value={formData.organDonor}
                    onValueChange={(val) => setFormData({ ...formData, organDonor: val })}
                  >
                    <SelectTrigger id="organDonor" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não">Não</SelectItem>
                      <SelectItem value="Sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* LINHA 3: Nacionalidade, Estado civil, Escolaridade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nationality" className="text-xs font-bold text-muted-foreground">
                    Nacionalidade
                  </Label>
                  <Input
                    id="nationality"
                    value={formData.nationality || ''}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Brasileira"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="maritalStatus" className="text-xs font-bold text-muted-foreground">
                    Estado civil
                  </Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(val) => setFormData({ ...formData, maritalStatus: val })}
                  >
                    <SelectTrigger id="maritalStatus" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      <SelectItem value="uniao_estavel">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="education" className="text-xs font-bold text-muted-foreground">
                    Escolaridade
                  </Label>
                  <Select
                    value={formData.education}
                    onValueChange={(val) => setFormData({ ...formData, education: val })}
                  >
                    <SelectTrigger id="education" className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                      <SelectItem value="medio">Ensino Médio</SelectItem>
                      <SelectItem value="superior">Ensino Superior</SelectItem>
                      <SelectItem value="pos_graduacao">Pós-Graduação / Mestrado / Doutorado</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* LINHA 4: Profissão, Tipo sanguíneo, Necessidades especiais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="profession" className="text-xs font-bold text-muted-foreground">
                    Profissão
                  </Label>
                  <Input
                    id="profession"
                    value={formData.profession || ''}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Ex: Professor, Autônomo..."
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bloodType" className="text-xs font-bold text-muted-foreground">
                    Tipo sanguíneo
                  </Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(val) => setFormData({ ...formData, bloodType: val })}
                  >
                    <SelectTrigger id="bloodType" className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selecione">Selecione</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="specialNeeds" className="text-xs font-bold text-muted-foreground">
                    Necessidades especiais
                  </Label>
                  <Select
                    value={formData.specialNeeds}
                    onValueChange={(val) => setFormData({ ...formData, specialNeeds: val })}
                  >
                    <SelectTrigger id="specialNeeds" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não">Não</SelectItem>
                      <SelectItem value="Sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* LINHA 5: CPF, RG, Passaporte */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cpf" className="text-xs font-bold text-muted-foreground">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ''}
                    onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    className="h-9 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rg" className="text-xs font-bold text-muted-foreground">
                    RG
                  </Label>
                  <Input
                    id="rg"
                    value={formData.rg || ''}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="Número do RG"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="passport" className="text-xs font-bold text-muted-foreground">
                    Passaporte
                  </Label>
                  <Input
                    id="passport"
                    value={formData.passport || ''}
                    onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                    placeholder="Passaporte"
                    className="h-9"
                  />
                </div>
              </div>

              {/* LINHA 6: Nome da Mãe, Nome do Pai, Data de atualização cadastral */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="motherName" className="text-xs font-bold text-muted-foreground">
                    Nome da Mãe
                  </Label>
                  <Input
                    id="motherName"
                    value={formData.motherName || ''}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    placeholder="Nome completo da mãe"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fatherName" className="text-xs font-bold text-muted-foreground">
                    Nome do Pai
                  </Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName || ''}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Nome completo do pai"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="registrationUpdatedAt" className="text-xs font-bold text-muted-foreground">
                    Data de atualização cadastral
                  </Label>
                  <Input
                    id="registrationUpdatedAt"
                    type="date"
                    value={formData.registrationUpdatedAt || todayStr}
                    onChange={(e) => setFormData({ ...formData, registrationUpdatedAt: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Botão para alternar seção de Dados Eclesiásticos & Contato */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtraDetails(!showExtraDetails)}
                  className="w-full justify-between text-xs font-medium border-dashed text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {showExtraDetails ? 'Ocultar dados de contato e eclesiásticos' : 'Mais detalhes: Contato, Batismo e Cargo Eclesiástico'}
                  </span>
                  {showExtraDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Seção Extra Expansível */}
              {showExtraDetails && (
                <div className="p-4 rounded-xl bg-muted/30 border space-y-4 animate-in fade-in-50 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        Telefone / WhatsApp
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        className="h-9 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="address" className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Endereço Completo
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade - UF"
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="role" className="text-xs font-bold text-muted-foreground">
                        Cargo / Função
                      </Label>
                      <Select
                        value={formData.role || 'Membro'}
                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                      >
                        <SelectTrigger id="role" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pastor">Pastor</SelectItem>
                          <SelectItem value="Pastora">Pastora</SelectItem>
                          <SelectItem value="Evangelista">Evangelista</SelectItem>
                          <SelectItem value="Diácono">Diácono</SelectItem>
                          <SelectItem value="Diaconisa">Diaconisa</SelectItem>
                          <SelectItem value="Presbítero">Presbítero</SelectItem>
                          <SelectItem value="Líder de Célula">Líder de Célula</SelectItem>
                          <SelectItem value="Líder de Ministério">Líder de Ministério</SelectItem>
                          <SelectItem value="Secretário(a)">Secretário(a)</SelectItem>
                          <SelectItem value="Tesoureiro(a)">Tesoureiro(a)</SelectItem>
                          <SelectItem value="Músico/Levita">Músico / Levita</SelectItem>
                          <SelectItem value="Membro">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="baptismDate" className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Data de Batismo
                      </Label>
                      <Input
                        id="baptismDate"
                        type="date"
                        value={formData.baptismDate || ''}
                        onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="category" className="text-xs font-bold text-muted-foreground">
                        Categoria
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                      >
                        <SelectTrigger id="category" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="membro">Membro</SelectItem>
                          <SelectItem value="congregado">Congregado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação no Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {onCancel && !isPublicForm && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || disabled}
              className={`bg-primary hover:bg-primary/90 text-white ${isPublicForm ? 'w-full sm:w-auto min-w-[220px] h-11 text-base font-bold' : 'min-w-[130px]'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando dados...
                </>
              ) : isPublicForm ? (
                'Enviar Meu Cadastro'
              ) : initialData?.name ? (
                'Salvar Alterações'
              ) : (
                'Cadastrar Membro'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
