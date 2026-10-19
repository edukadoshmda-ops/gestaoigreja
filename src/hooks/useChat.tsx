import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

export interface ChatProfile {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  is_announcement?: boolean;
  pinned_at?: string;
  is_starred?: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  type: 'private' | 'group' | 'cell' | 'ministry' | 'leaders' | 'prayers' | 'announcements';
  name?: string;
  description?: string;
  entity_id?: string;
  created_at: string;
  updated_at: string;
  participants: ChatProfile[];
  last_message?: ChatMessage;
  unread_count: number;
}

interface ChatContextType {
  currentUser: { id: string } | null;
  conversations: ChatConversation[];
  isLoadingConversations: boolean;
  useMessages: (conversationId: string | null) => UseQueryResult<ChatMessage[], Error>;
  sendMessage: (args: { conversationId: string; content: string; type?: 'text' | 'image' | 'file'; fileUrl?: string }) => Promise<any>;
  uploadFile: (file: File | Blob, path: string) => Promise<string>;
  isSending: boolean;
  searchUsers: ChatProfile[];
  startChat: (otherUserId: string) => Promise<string>;
  isStartingChat: boolean;
  pinMessage: (args: { messageId: string; pin: boolean }) => Promise<any>;
  createGroup: (args: { name: string; userIds: string[] }) => Promise<string>;
  isCreatingGroup: boolean;
  starMessage: (args: { messageId: string; star: boolean }) => Promise<any>;
  starredMessages: ChatMessage[];
  clearMessages: (conversationId: string) => Promise<string>;
  deleteConversation: (conversationId: string) => Promise<string>;
  deleteMessage: (messageId: string) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  createStandardRooms: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { churchId, viewingChurch, user } = useAuth();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(user?.id ? { id: user.id } : null);

  useEffect(() => {
    if (user?.id) {
      setCurrentUser({ id: user.id });
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUser({ id: data.session.user.id });
      } else if (user?.id) {
        setCurrentUser({ id: user.id });
      }
    });
  }, [user?.id]);

  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Limpeza automática de 30 dias para mensagens e anexos do Chat (roda em background no máx. 1x a cada 12h)
  useEffect(() => {
    if (!currentUser?.id || !effectiveChurchId || typeof window === 'undefined') return;

    const storageKey = `ecclesia_chat_cleanup_30d_${effectiveChurchId}`;
    const lastCleanup = Number(localStorage.getItem(storageKey) || '0');
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    if (Date.now() - lastCleanup < TWELVE_HOURS_MS) return;

    localStorage.setItem(storageKey, String(Date.now()));
    const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgoIso = new Date(thirtyDaysAgoMs).toISOString();

    (async () => {
      try {
        // 1. Aciona a RPC global do banco (limpa chat_messages > 30d preservando fixadas/favoritas, notificações e logs)
        await supabase.rpc('cleanup_old_ephemeral_data');
      } catch {
        // Fallback direto caso a RPC atualizada ainda não tenha sido rodada no SQL Editor
        try {
          await supabase
            .from('chat_messages')
            .delete()
            .eq('church_id', effectiveChurchId)
            .is('pinned_at', null)
            .lt('created_at', thirtyDaysAgoIso);
        } catch {
          // Ignora silenciosamente
        }
      }

      // 2. Limpa anexos de chat do próprio usuário no Storage com mais de 30 dias (economiza o 1 GB de Storage)
      try {
        const { data: files } = await supabase.storage
          .from('chat_attachments')
          .list(currentUser.id, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });

        if (files && files.length > 0) {
          const expiredPaths = files
            .filter((f) => f.created_at && new Date(f.created_at).getTime() < thirtyDaysAgoMs)
            .map((f) => `${currentUser.id}/${f.name}`);

          if (expiredPaths.length > 0) {
            await supabase.storage.from('chat_attachments').remove(expiredPaths);
          }
        }
      } catch {
        // Ignora silenciosamente
      }
    })();
  }, [currentUser?.id, effectiveChurchId]);

  useEffect(() => {
    if (!currentUser || !effectiveChurchId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const IDLE_TIMEOUT_MS = 75 * 1000; // 75s sem interação entra em Auto-Sleep para liberar vaga nas 200 conexões

    const disconnectChannel = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      setRealtimeConnected(false);
    };

    const connectChannel = () => {
      if (channel || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
        return;
      }

      channel = supabase.channel(`chat-church-${effectiveChurchId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: currentUser.id },
        }
      })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `church_id=eq.${effectiveChurchId}`
        }, (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          if (document.hidden && newMessage.sender_id !== currentUser.id) {
            showNotification('Nova mensagem', {
              body: newMessage.content,
              icon: '/logo-192.png'
            });
          }

          queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] });
          queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `church_id=eq.${effectiveChurchId}`
        }, () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] });
        })
        .subscribe((status) => {
          setRealtimeConnected(status === 'SUBSCRIBED');
        });
    };

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (!channel) {
          connectChannel();
          queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] });
          queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] });
        }
        idleTimer = setTimeout(() => {
          disconnectChannel();
        }, IDLE_TIMEOUT_MS);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (idleTimer) clearTimeout(idleTimer);
        disconnectChannel();
      } else {
        resetIdleTimer();
      }
    };

    resetIdleTimer();

    window.addEventListener('pointerdown', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('pointerdown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      disconnectChannel();
    };
  }, [currentUser, queryClient, effectiveChurchId]);

  const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const optimized = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.78 });
    const fileExt = (optimized instanceof File ? optimized.name : path).split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${currentUser!.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat_attachments')
      .upload(filePath, optimized, {
        cacheControl: STORAGE_CACHE_CONTROL,
        contentType: optimized.type || file.type || undefined,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('chat_attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const conversationsQuery = useQuery({
    queryKey: ['chat-conversations', effectiveChurchId, currentUser?.id],
    queryFn: async (): Promise<ChatConversation[]> => {
      if (!currentUser || !effectiveChurchId) return [];
      try {
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('conversation_id')
          .eq('profile_id', currentUser.id);
        
        const ids = participants?.map(p => p.conversation_id) || [];
        if (ids.length === 0) return [];

        const { data: convs, error } = await supabase
          .from('chat_conversations')
          .select(`
            *,
            participants:chat_participants(profile:profiles(id, name, full_name, avatar_url, email)),
            messages:chat_messages(id, conversation_id, sender_id, content, type, file_url, created_at)
          `)
          .in('id', ids)
          .eq('church_id', effectiveChurchId)
          .order('created_at', { referencedTable: 'chat_messages', ascending: false })
          .limit(1, { referencedTable: 'chat_messages' })
          .order('updated_at', { ascending: false });

        if (error) throw error;

        return convs.map(c => ({
          ...c,
          participants: (c.participants || [])
            .map((p: any) => p.profile ? ({
              id: p.profile.id,
              name: p.profile.full_name || p.profile.name || 'Membro',
              avatar_url: p.profile.avatar_url,
              email: p.profile.email
            }) : null)
            .filter(Boolean),
          last_message: c.messages?.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0],
          unread_count: 0
        }));
      } catch (err) {
        console.error('Chat error:', err);
        return [];
      }
    },
    enabled: !!currentUser && !!effectiveChurchId,
    // Fallback HTTP automático caso as 200 conexões WebSocket estejam cheias ou em Auto-Sleep
    refetchInterval: realtimeConnected ? false : 15000,
    refetchIntervalInBackground: false,
  });

  const useMessages = (conversationId: string | null) => useQuery({
    queryKey: ['chat-messages', effectiveChurchId, conversationId],
    queryFn: async () => {
      if (!conversationId || !effectiveChurchId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('church_id', effectiveChurchId)
        .order('created_at', { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data || []).reverse();
    },
    enabled: !!conversationId && !!effectiveChurchId,
    // Fallback HTTP de 4.5s na conversa ativa se o WebSocket estiver em sleep ou acima de 200 simultâneos
    refetchInterval: conversationId && !realtimeConnected ? 4500 : false,
    refetchIntervalInBackground: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, type = 'text', fileUrl }: { conversationId: string; content: string; type?: 'text' | 'image' | 'file'; fileUrl?: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ 
          conversation_id: conversationId, 
          church_id: effectiveChurchId,
          content, 
          sender_id: currentUser!.id,
          type,
          file_url: fileUrl
        })
        .select().single();
      if (error) throw error;
      await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId).eq('church_id', effectiveChurchId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] });
    }
  });

  const startChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const myId = currentUser?.id || (await supabase.auth.getUser()).data.user?.id;
      if (!myId) throw new Error('Usuário não autenticado.');

      // 1. Tentar RPC primeiro
      try {
        const { data, error } = await supabase.rpc('get_or_create_chat', { 
          other_user_id: otherUserId, 
          p_church_id: effectiveChurchId 
        });
        if (!error && data) return data;
      } catch (rpcErr) {
        console.warn('RPC get_or_create_chat falhou, usando fallback direto:', rpcErr);
      }

      // 2. Fallback direto: verificar se já existe conversa privada entre os dois nesta igreja
      try {
        const { data: myConvs } = await supabase
          .from('chat_participants')
          .select('conversation_id')
          .eq('profile_id', myId);

        const myConvIds = (myConvs || []).map((c: any) => c.conversation_id);

        if (myConvIds.length > 0) {
          const { data: existing } = await supabase
            .from('chat_participants')
            .select('conversation_id')
            .in('conversation_id', myConvIds)
            .eq('profile_id', otherUserId);

          if (existing && existing.length > 0) {
            // Verifica se a conversa pertence à igreja atual
            const { data: matchingConv } = await supabase
              .from('chat_conversations')
              .select('id')
              .eq('id', existing[0].conversation_id)
              .eq('church_id', effectiveChurchId)
              .maybeSingle();

            if (matchingConv) {
              return matchingConv.id;
            }
          }
        }

        // 3. Criar nova conversa privada com a igreja isolada
        const { data: newConv, error: convErr } = await (supabase.from('chat_conversations') as any)
          .insert({ 
            type: 'private',
            church_id: effectiveChurchId 
          })
          .select()
          .single();

        if (convErr || !newConv) throw convErr || new Error('Não foi possível criar conversa.');

        // 4. Inserir participantes
        const participants = [
          { conversation_id: newConv.id, profile_id: myId, role: 'member' },
          { conversation_id: newConv.id, profile_id: otherUserId, role: 'member' }
        ];

        await (supabase.from('chat_participants') as any).insert(participants);

        return newConv.id;
      } catch (err: any) {
        console.error('Erro ao criar conversa privada:', err);
        throw err;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] })
  });

  const pinMessageMutation = useMutation({
    mutationFn: async ({ messageId, pin }: { messageId: string; pin: boolean }) => {
      await supabase.from('chat_messages').update({ pinned_at: pin ? new Date().toISOString() : null }).eq('id', messageId).eq('church_id', effectiveChurchId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] })
  });

  const starMessageMutation = useMutation({
    mutationFn: async ({ messageId, star }: { messageId: string, star: boolean }) => {
      if (star) await supabase.from('chat_starred_messages').insert({ message_id: messageId, profile_id: currentUser!.id, church_id: effectiveChurchId });
      else await supabase.from('chat_starred_messages').delete().eq('message_id', messageId).eq('profile_id', currentUser!.id).eq('church_id', effectiveChurchId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['starred-messages', effectiveChurchId] })
  });

  const starredMessagesQuery = useQuery({
    queryKey: ['starred-messages', effectiveChurchId],
    queryFn: async () => {
      if (!effectiveChurchId) return [];
      const { data } = await supabase.from('chat_starred_messages').select('chat_messages(*)').eq('profile_id', currentUser!.id).eq('church_id', effectiveChurchId);
      return (data || []).map((item: any) => item.chat_messages).filter(Boolean) as ChatMessage[];
    },
    enabled: !!currentUser && !!effectiveChurchId,
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, userIds }: { name: string, userIds: string[] }) => {
      const myId = currentUser?.id || user?.id || (await supabase.auth.getUser()).data.user?.id;
      if (!myId) throw new Error('Usuário não autenticado.');

      // Inserção da conversa do grupo com church_id garantido
      const { data: conv, error: convErr } = await (supabase.from('chat_conversations') as any)
        .insert({ 
          name: name.trim(), 
          type: 'group',
          church_id: effectiveChurchId 
        })
        .select()
        .single();

      if (convErr || !conv) {
        console.error('Erro ao criar grupo:', convErr);
        throw convErr || new Error('Não foi possível criar o grupo.');
      }

      const convId = conv.id;

      // Inserir criador como admin
      await (supabase.from('chat_participants') as any).insert({
        conversation_id: convId,
        profile_id: myId,
        role: 'admin'
      }).catch((e: any) => console.warn('Aviso ao registrar criador:', e));

      // Inserir os outros participantes
      const otherUserIds = userIds.filter(id => id !== myId);
      if (otherUserIds.length > 0) {
        const otherParticipants = otherUserIds.map(id => ({
          conversation_id: convId,
          profile_id: id,
          role: 'member'
        }));

        const { error: batchErr } = await (supabase.from('chat_participants') as any).insert(otherParticipants);
        if (batchErr) {
          console.warn('Inserção em lote falhou, inserindo participantes individualmente:', batchErr);
          for (const uid of otherUserIds) {
            await (supabase.from('chat_participants') as any).insert({
              conversation_id: convId,
              profile_id: uid,
              role: 'member'
            }).catch(() => {});
          }
        }
      }

      return convId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] });
      await queryClient.refetchQueries({ queryKey: ['chat-conversations', effectiveChurchId] });
    }
  });

  const clearMessagesMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await supabase.from('chat_messages').delete().eq('conversation_id', conversationId).eq('church_id', effectiveChurchId).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        // Pode ser que não houvesse mensagens, o que não é um erro fatal, mas logamos
        console.log('Nenhuma mensagem apagada (talvez vazio ou sem permissão)');
      }
      return conversationId;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] })
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // 1. Delete all messages first
      const { error: msgError } = await supabase.from('chat_messages').delete().eq('conversation_id', conversationId).eq('church_id', effectiveChurchId);
      if (msgError) console.error("Erro ao apagar mensagens:", msgError);

      // 2. Tentar apagar a conversa ANTES dos participantes (para não perder o RLS de admin)
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('church_id', effectiveChurchId)
        .select();
        
      if (convError) throw convError;
      
      // Se convData for vazio, o RLS bloqueou silenciosamente (não tem permissão global)
      if (!convData || convData.length === 0) {
        // Fallback: Apenas sai da conversa apagando a própria participação
        const { error: leaveError } = await supabase
          .from('chat_participants')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('profile_id', (await supabase.auth.getUser()).data.user?.id);
          
        if (leaveError) throw leaveError;
        return conversationId; // Conclui com sucesso (vai sumir da lista)
      }

      // 3. Se apagou a conversa com sucesso, apaga os participantes restantes
      await supabase.from('chat_participants').delete().eq('conversation_id', conversationId);

      return conversationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] });
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('chat_messages').delete().eq('id', messageId).eq('church_id', effectiveChurchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', effectiveChurchId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] });
    }
  });

  const createStandardRoomsMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) return;
      const rooms = [
        { name: 'Pastores', type: 'leaders' },
        { name: 'Células', type: 'cell' },
        { name: 'Ministérios', type: 'ministry' },
        { name: 'Membros', type: 'group' }
      ];

      for (const room of rooms) {
        const { data: conv, error } = await supabase.from('chat_conversations').insert({ ...room, church_id: effectiveChurchId }).select().single();
        if (error || !conv) continue;
        
        await supabase.from('chat_participants').insert({
          conversation_id: conv.id,
          profile_id: currentUser.id,
          role: 'admin'
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-conversations', effectiveChurchId] })
  });

  const searchUsersQuery = useQuery({
    queryKey: ['chat-users-search', effectiveChurchId, currentUser?.id, user?.id],
    queryFn: async () => {
      if (!effectiveChurchId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, full_name, avatar_url, email')
        .eq('church_id', effectiveChurchId)
        .order('full_name', { ascending: true });
      if (error) {
        console.error('Erro ao buscar usuários do chat:', error);
        return [];
      }
      const myId = currentUser?.id || user?.id;
      return (data || [])
        .filter((u: any) => u.id !== myId)
        .map((u: any) => ({
          id: u.id,
          name: u.full_name || u.name || 'Membro',
          avatar_url: u.avatar_url,
          email: u.email
        }));
    },
    enabled: !!effectiveChurchId,
    staleTime: 1000 * 60 * 15, // 15 minutos de cache
  });

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
      // Play a subtle sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.play().catch(() => {});
    }
  };

  return (
    <ChatContext.Provider value={{
      currentUser,
      conversations: conversationsQuery.data || [],
      isLoadingConversations: conversationsQuery.isLoading,
      useMessages,
      sendMessage: sendMessageMutation.mutateAsync,
      uploadFile,
      isSending: sendMessageMutation.isPending,
      searchUsers: searchUsersQuery.data || [],
      startChat: startChatMutation.mutateAsync,
      isStartingChat: startChatMutation.isPending,
      pinMessage: pinMessageMutation.mutateAsync,
      createGroup: createGroupMutation.mutateAsync,
      isCreatingGroup: createGroupMutation.isPending,
      starMessage: starMessageMutation.mutateAsync,
      starredMessages: starredMessagesQuery.data || [],
      clearMessages: clearMessagesMutation.mutateAsync,
      deleteConversation: deleteConversationMutation.mutateAsync,
      deleteMessage: deleteMessageMutation.mutateAsync,
      requestNotificationPermission,
      createStandardRooms: createStandardRoomsMutation.mutateAsync
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
