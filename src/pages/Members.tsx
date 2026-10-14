import { useState, useEffect } from 'react';
import { Plus, Loader2, Cake, Users as UsersIcon, FileDown, Filter, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sidebar } from '@/components/Sidebar';
import { MemberList } from '@/components/MemberList';
import { MemberForm, MemberFormData } from '@/components/MemberForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Member } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { membersService } from '@/services/members.service';
import { ExcelMembersButton } from '@/components/ExcelMembersReport';
import { ImportMembersModal } from '@/components/ImportMembersModal';
import { churchesService } from '@/services/churches.service';
import { pastorsService } from '@/services/pastors.service';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PlanBanner, MemberLimitGuard } from '@/components/PlanBanner';
import { useSubscriptionPlan } from '@/hooks/useSubscriptionPlan';
import { extractExtendedFields, packExtendedFieldsToNotes } from '@/lib/memberUtils';
import { MemberIdCard } from '@/components/MemberIdCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTenant } from '@/hooks/useTenant';

export default function Members() {
  useDocumentTitle('Membros');
  const { tenant } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churchName, setChurchName] = useState<string>(tenant?.name || '');
  const [churchLogo, setChurchLogo] = useState<string>(tenant?.logo_url || '');
  const [churchCnpj, setChurchCnpj] = useState<string>((tenant as any)?.cnpj || '');
  const [churchAddress, setChurchAddress] = useState<string>(tenant?.address || '');
  const [pastorName, setPastorName] = useState<string>(tenant?.president_name || '');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterMarital, setFilterMarital] = useState<string>('todos');
  const { toast } = useToast();
  const { user, churchId, viewingChurch } = useAuth();
  const planInfo = useSubscriptionPlan();
  // Prioriza o churchId do contexto (atualizado quando superadmin visualiza uma igreja)
  // Se não houver, usa o churchId do usuário
  const effectiveChurchId = churchId || user?.churchId;

  useEffect(() => {
    loadMembers();
  }, [effectiveChurchId, viewingChurch?.id]);

  useEffect(() => {
    if (tenant) {
      if (tenant.name) setChurchName(tenant.name);
      if (tenant.logo_url) setChurchLogo(tenant.logo_url);
      if ((tenant as any).cnpj) setChurchCnpj((tenant as any).cnpj);
      if (tenant.address) setChurchAddress(tenant.address);
      if (tenant.president_name) setPastorName(tenant.president_name);
    }
    if (!effectiveChurchId) return;
    (async () => {
      try {
        const [church, pastors] = await Promise.all([
          churchesService.getById(effectiveChurchId),
          pastorsService.listByChurch(effectiveChurchId),
        ]);
        const churchObj = church as any;
        const pastorsArr = Array.isArray(pastors) ? pastors : [];
        const firstPastor = pastorsArr[0] as { name?: string } | undefined;
        if (churchObj?.name) setChurchName(churchObj.name);
        if (churchObj?.logo_url) setChurchLogo(churchObj.logo_url);
        if (churchObj?.cnpj) setChurchCnpj(churchObj.cnpj);
        if (churchObj?.address) setChurchAddress(churchObj.address);
        setPastorName(firstPastor?.name || churchObj?.president_name || tenant?.president_name || '');
      } catch {
        setChurchName(viewingChurch?.name || tenant?.name || '');
        setChurchLogo(tenant?.logo_url || '');
        setPastorName(tenant?.president_name || '');
      }
    })();
  }, [effectiveChurchId, viewingChurch?.name, tenant]);

  async function loadMembers() {
    try {
      setError(null);
      setLoading(true);
      const data = await membersService.getAll(effectiveChurchId);
      // Map DB snake_case to Frontend camelCase
      const mappedMembers: Member[] = (data || []).map((m: any) => {
        const ext = extractExtendedFields(m);
        return {
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
          notes: m.notes,
          ...ext,
        } as Member;
      });
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
      setSaving(true);
      const packedNotes = packExtendedFieldsToNotes(
        (editingMember as any)?.notes || '',
        data
      );

      const cid = effectiveChurchId || editingMember?.churchId || 'igreja-padrao';

      if (editingMember) {
        await membersService.update(editingMember.id, {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          birth_date: data.birthDate || null,
          marital_status: data.maritalStatus as any,
          address: data.address || null,
          photo_url: data.photoUrl || null,
          notes: packedNotes,
          status: data.category === 'congregado' ? 'visitante' : 'ativo',
          church_id: cid,
        }, cid);

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
          marital_status: data.maritalStatus as any,
          address: data.address || null,
          photo_url: data.photoUrl || null,
          notes: packedNotes,
          status: data.category === 'congregado' ? 'visitante' : 'ativo',
        }, cid);

        toast({
          title: 'Membro cadastrado!',
          description: `${data.name} foi adicionado com sucesso.`,
        });
      }
      setShowForm(false);
      setEditingMember(null);
      await loadMembers();
    } catch (error: any) {
      console.error('Erro ao salvar membro:', error);
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Ocorreu um problema ao tentar salvar os dados. Verifique sua permissão ou conexão.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDeleteMember = async (id: string) => {
    try {
      setDeletingId(id);
      await membersService.delete(id, effectiveChurchId);
      setMembers(members.filter(m => m.id !== id));
      toast({
        title: 'Membro removido',
        description: 'O membro foi excluído do sistema.',
        variant: 'destructive',
      });
    } catch (error: any) {
      const msg = error?.message || '';
      let friendlyMsg = 'Não foi possível remover o membro.';
      if (msg.includes('cells_host_id_fkey') || msg.includes('cells_leader_id_fkey') || msg.includes('cells')) {
        friendlyMsg = 'O membro possuía vínculo como anfitrião ou líder de célula. A referência foi desvinculada, tente excluir novamente.';
      } else if (msg.includes('foreign key') || msg.includes('violates')) {
        friendlyMsg = 'Não foi possível excluir porque o membro possui vínculos ativos em outros módulos.';
      } else if (msg) {
        friendlyMsg = msg;
      }
      toast({
        title: 'Erro ao excluir',
        description: friendlyMsg,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PlanBanner />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membros e Congregados</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da igreja
            {!planInfo.loading && planInfo.maxMembers < 99999 && (
              <span className="ml-2 text-xs font-semibold text-muted-foreground/70">
                ({planInfo.currentMembers}/{planInfo.maxMembers} no plano {planInfo.label})
              </span>
            )}
          </p>
        </div>
        {!showForm && (
          <div className="flex flex-wrap gap-2">
            {(user?.role === 'superadmin' || !['aluno', 'membro', 'congregado'].includes(user?.role ?? '')) && (
              <ExcelMembersButton />
            )}
            {(user?.role === 'superadmin' || (!['aluno', 'membro', 'congregado', 'tesoureiro'].includes(user?.role ?? ''))) && (
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(true)}
                className="gap-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold"
              >
                <Upload className="h-4 w-4 text-emerald-600" />
                Importar Planilha Excel
              </Button>
            )}
            {(user?.role === 'superadmin' || (user?.role !== 'aluno' && user?.role !== 'membro' && user?.role !== 'congregado' && user?.role !== 'tesoureiro')) && (
              <MemberLimitGuard
                fallback={
                  <Button disabled variant="outline" className="w-full sm:w-auto opacity-50 cursor-not-allowed">
                    <Plus className="h-4 w-4 mr-2" />
                    Limite Atingido
                  </Button>
                }
              >
                <Button onClick={() => { setEditingMember(null); setShowForm(true); }} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Membro
                </Button>
              </MemberLimitGuard>
            )}
          </div>
        )}
      </div>

      {showForm && planInfo.isLimitReached && !editingMember ? (
        <MemberLimitGuard>
          <></>
        </MemberLimitGuard>
      ) : showForm ? (
        <MemberForm
          onSubmit={handleAddMember}
          onCancel={() => { setShowForm(false); setEditingMember(null); }}
          initialData={editingMember || undefined}
          churchName={churchName}
          pastorName={pastorName}
          isSubmitting={saving}
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="congregado">Congregado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMarital} onValueChange={setFilterMarital}>
                <SelectTrigger className="w-full sm:w-[150px] h-9">
                  <SelectValue placeholder="Estado civil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
              members={members.filter(m => {
                if (filterCategory !== 'todos' && m.category !== filterCategory) return false;
                if (filterMarital !== 'todos' && m.maritalStatus !== filterMarital) return false;
                return true;
              })}
              onDelete={handleDeleteMember}
              onEdit={handleEdit}
              onViewCard={(member) => setSelectedCardMember(member)}
              deletingId={deletingId}
            />
          </TabsContent>

          <TabsContent value="aniversariantes">
            <MemberList
              members={members.filter(m => {
                if (filterCategory !== 'todos' && m.category !== filterCategory) return false;
                if (filterMarital !== 'todos' && m.maritalStatus !== filterMarital) return false;
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
              onViewCard={(member) => setSelectedCardMember(member)}
              deletingId={deletingId}
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

      {/* Modal / Dialog da Carteirinha Personalizada do Membro */}
      <Dialog
        open={!!selectedCardMember}
        onOpenChange={(open) => !open && setSelectedCardMember(null)}
      >
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span>Personalização da Carteirinha</span>
              {selectedCardMember && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {selectedCardMember.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedCardMember && (
            <MemberIdCard
              member={selectedCardMember}
              churchName={churchName || 'Igreja Evangélica'}
              churchLogo={churchLogo}
              pastorName={pastorName || 'Pastor Presidente'}
              cnpj={churchCnpj}
              churchAddress={churchAddress}
              onSaveConfig={(newConfig) => {
                // Atualiza a configuração local do membro
                setSelectedCardMember(prev => prev ? { ...prev, customCardConfig: newConfig } : null);
              }}
              onUpdateMember={(updated) => {
                setSelectedCardMember(prev => prev ? { ...prev, ...updated } : null);
                setMembers(prev => prev.map(m => m.id === selectedCardMember.id ? { ...m, ...updated } : m));
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Importação de Planilha Excel */}
      <ImportMembersModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        churchId={effectiveChurchId || 'igreja-padrao'}
        onSuccess={() => loadMembers()}
      />
    </div>
  );
}
