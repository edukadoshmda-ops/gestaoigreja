import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Search, Trash2, Edit, Phone, Mail, MapPin, Cake, MessageSquare, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Member } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { Users } from 'lucide-react';

interface MemberListProps {
  members: Member[];
  onDelete: (id: string) => void | Promise<void>;
  onEdit: (member: Member) => void;
  onViewCard?: (member: Member) => void;
  deletingId?: string | null;
}

export function MemberList({ members, onDelete, onEdit, onViewCard, deletingId }: MemberListProps) {
  const [search, setSearch] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const { user } = useAuth();
  const { canEdit } = usePermissions();
  const canDelete = canEdit;

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membros..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum membro encontrado"
            description={members.length === 0 ? "Cadastre o primeiro membro da igreja." : "Nenhum resultado para sua busca."}
          />
        ) : filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow overflow-visible">
            <CardContent className="p-4 pr-5 overflow-visible">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
                <div className="flex items-start gap-3 min-w-0 flex-1 overflow-hidden">
                  <div className="flex-shrink-0 relative">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className={`h-14 w-14 rounded-full object-cover border-2 ${(member.birthDate && new Date(member.birthDate).getMonth() === new Date().getMonth() && new Date(member.birthDate).getDate() === new Date().getDate())
                          ? 'border-primary ring-2 ring-primary/20 animate-pulse'
                          : 'border-primary/20'
                          }`}
                      />
                    ) : (
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center border-2 ${(member.birthDate && new Date(member.birthDate).getMonth() === new Date().getMonth() && new Date(member.birthDate).getDate() === new Date().getDate())
                        ? 'bg-primary/20 border-primary ring-2 ring-primary/20'
                        : 'bg-primary/10 border-primary/5'
                        }`}>
                        <span className="text-primary font-bold text-xl">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {(member.birthDate && new Date(member.birthDate).getMonth() === new Date().getMonth() && new Date(member.birthDate).getDate() === new Date().getDate()) && (
                      <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                        <Cake className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-semibold text-lg truncate">
                      {member.prefix ? `${member.prefix} ` : ''}{member.name}
                      {member.nickname ? <span className="text-sm font-normal text-muted-foreground ml-2">({member.nickname})</span> : null}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 min-w-0 max-w-full">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{member.email || 'Não informado'}</span>
                      </span>
                      <span className="flex items-center gap-1 group">
                        <Phone className="h-4 w-4" />
                        {member.phone || 'Não informado'}
                        {member.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600 hover:text-white hover:bg-green-600 rounded-full transition-all duration-300 ml-1"
                            title="Conversar no WhatsApp"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isBirthday = member.birthDate && new Date(member.birthDate).getMonth() === new Date().getMonth() && new Date(member.birthDate).getDate() === new Date().getDate();
                              const text = isBirthday
                                ? `Olá ${member.name.split(' ')[0]}, Graça e Paz! Passando para te desejar um feliz aniversário! 🎉 Que o Senhor te abençoe ricamente neste novo ano de vida!`
                                : `Olá ${member.name.split(' ')[0]}, Graça e Paz! Tudo bem?`;

                              const cleanPhone = member.phone.replace(/\D/g, '');
                              const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                              window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </span>
                      <Badge variant={member.category === 'membro' ? 'default' : 'secondary'} className="capitalize">
                        {member.category}
                      </Badge>
                      {member.role && (
                        <Badge variant="outline" className="font-semibold text-primary border-primary/30">
                          {member.role}
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {member.maritalStatus}
                      </Badge>
                      {member.bloodType && member.bloodType !== 'selecione' && (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">
                          Sangue: {member.bloodType}
                        </Badge>
                      )}
                      {member.address && (
                        <span className="flex items-center gap-1 min-w-0 max-w-full">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{member.address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 sm:pl-2 pt-3 sm:pt-0 border-t sm:border-t-0 mt-3 sm:mt-0 sm:self-start">
                  {onViewCard && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Carteirinha de Membro (Ver / Personalizar / Imprimir)"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => onViewCard(member)}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(member)} title="Editar dados">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={!!deletingId}
                      onClick={() => setMemberToDelete(member)}
                      title="Excluir membro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o membro {memberToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (memberToDelete) {
                  await onDelete(memberToDelete.id);
                  setMemberToDelete(null);
                }
              }}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
