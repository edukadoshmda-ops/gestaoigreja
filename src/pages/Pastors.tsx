import { useState, useEffect } from 'react';
import { UserRound, Upload, Save, Plus, Pencil, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabaseClient';
import { pastorsService, ChurchPastor } from '@/services/pastors.service';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

export default function Pastors() {
  useDocumentTitle('Pastores');
  const { toast } = useToast();
  const { user, churchId, viewingChurch } = useAuth();
  const { canEditPastors } = usePermissions();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;
  const canEdit = canEditPastors;

  const [pastors, setPastors] = useState<ChurchPastor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    photo_url: '',
    bio: '',
  });

  useEffect(() => {
    if (effectiveChurchId) loadPastors();
    else setLoading(false);
  }, [effectiveChurchId]);

  async function loadPastors() {
    if (!effectiveChurchId) return;
    setLoading(true);
    try {
      const list = await pastorsService.listByChurch(effectiveChurchId);
      setPastors(list);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: ChurchPastor) {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      position: p.position || '',
      photo_url: p.photo_url || '',
      bio: p.bio || '',
    });
    setShowForm(false);
  }

  function startNew() {
    setEditingId(null);
    setFormData({ name: '', position: '', photo_url: '', bio: '' });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', position: '', photo_url: '', bio: '' });
  }

  const handleSave = async () => {
    if (!effectiveChurchId || !canEdit) return;
    if (!formData.name.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome do pastor.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await pastorsService.update(editingId, {
          name: formData.name.trim(),
          position: formData.position.trim() || null,
          photo_url: formData.photo_url.trim() || null,
          bio: formData.bio.trim() || null,
        });
        toast({ title: 'Pastor atualizado!', description: 'As informações foram salvas.' });
      } else {
        await pastorsService.create({
          church_id: effectiveChurchId,
          name: formData.name.trim(),
          position: formData.position.trim() || null,
          photo_url: formData.photo_url.trim() || null,
          bio: formData.bio.trim() || null,
          display_order: pastors.length,
        });
        toast({ title: 'Pastor adicionado!', description: 'O pastor foi incluído na apresentação.' });
      }
      cancelEdit();
      loadPastors();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit || !confirm('Deseja remover este pastor da apresentação?')) return;
    setSaving(true);
    try {
      await pastorsService.delete(id);
      toast({ title: 'Pastor removido', description: 'O pastor foi excluído da apresentação.' });
      loadPastors();
      if (editingId === id) cancelEdit();
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldSetter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.78 });
      const fileName = optimized instanceof File ? optimized.name : file.name;
      const path = `pastors/${effectiveChurchId}/${Date.now()}-${fileName}`;
      const { error } = await supabase.storage
        .from('church-documents')
        .upload(path, optimized, {
          cacheControl: STORAGE_CACHE_CONTROL,
          contentType: optimized.type || file.type,
        });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('church-documents')
        .getPublicUrl(path);
      fieldSetter(publicUrl);
      toast({ title: 'Foto carregada!', description: 'Salve as alterações para aplicar.' });
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    }
  };

  if (!effectiveChurchId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <UserRound className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma igreja</h2>
        <p className="text-muted-foreground">É necessário ter uma igreja vinculada para ver os pastores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserRound className="h-8 w-8 text-primary" />
            Pastores
          </h1>
          <p className="text-muted-foreground mt-1">
            Apresentação dos pastores da igreja
          </p>
        </div>
        {canEdit && !showForm && !editingId && (
          <Button onClick={startNew} variant="default" className="shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pastor
          </Button>
        )}
      </div>

      {/* Formulário (novo ou edição) */}
      {(showForm || editingId) && canEdit && (
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-2 bg-primary/20 w-full" />
          <CardHeader>
            <CardTitle className="text-xl">
              {editingId ? 'Editar Pastor' : 'Novo Pastor'}
            </CardTitle>
            <CardDescription>
              Foto e texto para a apresentação do pastor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Área da foto */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[200px] aspect-square rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center border-2 border-dashed border-border">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt={formData.name || 'Pastor'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-20 w-20 text-muted-foreground" />
                  )}
                </div>
                <div className="w-full max-w-[200px] border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-all relative bg-primary/5 cursor-pointer">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, (url) => setFormData({ ...formData, photo_url: url }))}
                  />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Clique para upload</p>
                </div>
              </div>

              {/* Campos de texto */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pr. João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo / Função</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Pastor Presidente, Pastor de Jovens"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Texto de Apresentação</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Breve biografia ou mensagem do pastor..."
                    rows={5}
                    className="resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando…' : 'Salvar'}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    Cancelar
                  </Button>
                  {editingId && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(editingId)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de cards de apresentação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pastors.length === 0 && !showForm && (
          <Card className="md:col-span-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserRound className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-center mb-4">
                Nenhum pastor cadastrado. Adicione pastores para exibir na apresentação.
              </p>
              {canEdit && (
                <Button onClick={startNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pastor
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {pastors.map((p) => (
          <Card key={p.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-2 bg-primary/20 w-full" />
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Foto */}
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                  {p.position && (
                    <p className="text-sm font-medium text-primary mt-1">{p.position}</p>
                  )}
                  {p.bio && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
                      {p.bio}
                    </p>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 -ml-2"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
