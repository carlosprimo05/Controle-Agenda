import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalAuth } from '@/lib/LocalAuthContext';
import { ArrowLeft, Plus, Users, User, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewConversationDialog from './NewConversationDialog';
import ChatRoom from './ChatRoom';
import { markConvAsRead, getConvLastRead } from './ChatButton';

export default function ChatPanel({ onClose }) {
  const { currentUser } = useLocalAuth();
  const [newDialog, setNewDialog] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.ChatConversation.list('-last_message_at', 100),
    refetchInterval: 5000,
  });

  const myConversations = conversations.filter(c =>
    c.participants?.includes(currentUser?.username)
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatConversation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  // Subscription em tempo real para atualizar lista de conversas
  useEffect(() => {
    const unsubscribe = base44.entities.ChatConversation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    return unsubscribe;
  }, []);

  const handleOpenConversation = (conv) => {
    markConvAsRead(conv.id);
    setActiveConversation(conv);
  };

  if (activeConversation) {
    return (
      <ChatRoom
        conversation={activeConversation}
        onBack={() => setActiveConversation(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Chat</h1>
        </div>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setNewDialog(true)}>
          <Plus className="w-4 h-4" /> Nova
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : myConversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma conversa ainda</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Toque em "Nova" para começar</p>
          </div>
        ) : (
          myConversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUser={currentUser?.username}
              onClick={() => handleOpenConversation(conv)}
              onDelete={(e) => { e.stopPropagation(); deleteMutation.mutate(conv.id); }}
            />
          ))
        )}
      </div>

      <NewConversationDialog
        open={newDialog}
        onClose={() => setNewDialog(false)}
        currentUser={currentUser?.username}
        onCreated={(conv) => { setNewDialog(false); setActiveConversation(conv); }}
      />
    </div>
  );
}

function ConversationItem({ conversation, currentUser, onClick, onDelete }) {
  const isGroup = conversation.type === 'group';
  const otherParticipant = conversation.participants?.find(p => p !== currentUser);
  const displayName = isGroup ? conversation.name : otherParticipant;

  const hasUnread = conversation.last_message_at &&
    conversation.last_message_sender !== currentUser &&
    new Date(conversation.last_message_at) > getConvLastRead(conversation.id);

  return (
    <div className={`w-full bg-card rounded-2xl border flex items-center hover:bg-muted/50 transition-all ${hasUnread ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}>
      <button
        onClick={onClick}
        className="flex-1 p-4 flex items-center gap-3 text-left active:scale-[0.99]"
      >
        <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {isGroup ? <Users className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
          {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${hasUnread ? 'font-bold text-primary' : 'font-semibold'}`}>{displayName}</p>
            {conversation.last_message_at && (
              <span className={`text-xs shrink-0 ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {format(new Date(conversation.last_message_at), 'HH:mm', { locale: ptBR })}
              </span>
            )}
          </div>
          <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {isGroup
              ? <span className="text-primary/70">{conversation.participants?.filter(p => p !== currentUser).join(', ')} · </span>
              : null
            }
            {conversation.last_message || 'Sem mensagens ainda'}
          </p>
        </div>
      </button>
      <button
        onClick={onDelete}
        className="p-3 mr-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}