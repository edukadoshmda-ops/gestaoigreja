import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Trash2, Edit, Phone, Mail, MapPin, Cake } from 'lucide-react';
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

interface MemberListProps {
  members: Member[];
  onDelete: (id: string) => void;
  onEdit: (member: Member) => void;
}

export function MemberList({ members, onDelete, onEdit }: MemberListProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'secretario';
  const canEdit = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'secretario';

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
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
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
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {member.phone}
                        {member.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isBirthday = member.birthDate && new Date(member.birthDate).getMonth() === new Date().getMonth() && new Date(member.birthDate).getDate() === new Date().getDate();
                              const text = isBirthday
                                ? `Olá ${member.name.split(' ')[0]}, Graça e Paz! Passando para te desejar um feliz aniversário! 🎉 Que o Senhor te abençoe ricamente neste novo ano de vida!`
                                : `Olá ${member.name.split(' ')[0]}, Graça e Paz! Tudo bem?`;
                              window.open(`https://wa.me/55${member.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                      </span>
                      <Badge variant={member.category === 'membro' ? 'default' : 'secondary'} className="capitalize">
                        {member.category}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {member.maritalStatus}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {member.address}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(member)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o membro {member.name}? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(member.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
