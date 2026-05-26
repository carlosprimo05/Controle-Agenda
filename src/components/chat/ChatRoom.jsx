import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalAuth } from '@/lib/LocalAuthContext';
import { ArrowLeft, Send, File as FileIcon, Users, X, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import GroupSettingsDialog from './GroupSettingsDialog';

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Ensure UTC parsing by appending Z if missing
  return new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
}

// image compression helper removed — attachments disabled in chat

export default function ChatRoom({ conversation, onBack, onClose }) {
  const { currentUser } = useLocalAuth();
  const [text, setText] = useState('');
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [conversationState, setConversationState] = useState(conversation);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setConversationState(conversation);
  }, [conversation]);

  const isGroup = conversationState.type === 'group';
  const otherParticipant = conversationState.participants?.find(p => p !== currentUser?.username);
  const displayName = isGroup ? conversationState.name : otherParticipant;
  const isGroupAdmin = isGroup && conversationState.created_by === currentUser?.username;

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: async () => {
      const all = await base44.entities.ChatMessage.filter({ conversation_id: conversation.id }, '-created_date', 200);
      const now = new Date();
      return all.filter(m => !m.expires_at || new Date(m.expires_at) > now).reverse();
    },
    refetchInterval: 3000,
  });

  useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.conversation_id === conversation.id) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    });
    return unsubscribe;
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: async (_, vars) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
        // Atualiza conversa em try/catch para prevenir crashes caso o update falhe
        await base44.entities.ChatConversation.update(conversation.id, {
          last_message: vars?.message_type === 'text' ? vars.content : '[mídia]',
          last_message_at: new Date().toISOString(),
          last_message_sender: currentUser?.username,
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (err) {
        console.error('Erro ao atualizar conversa:', err);
        toast.error('Mensagem enviada, mas falha ao atualizar conversa.');
      }
    },
  });

  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      const all = await base44.entities.ChatMessage.filter({ conversation_id: conversation.id }, '-created_date', 200);
      await Promise.all(all.map(m => base44.entities.ChatMessage.delete(m.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      toast.success('Conversa limpa!');
    },
  });

  const handleSend = async () => {
    if (!text.trim()) return;
    const payload = {
      conversation_id: conversation.id,
      sender: currentUser.username,
      message_type: 'text',
      content: text.trim(),
      expires_at: addDays(new Date(), 7).toISOString(),
    };
    try {
      await sendMutation.mutateAsync(payload);
      setText('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      toast.error(err?.message || 'Falha ao enviar mensagem');
    }
  };

  // Attachments and voice recording handlers removed

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {isGroup ? `${conversation.participants?.length} participantes` : 'Conversa direta'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => { if (confirm('Limpar todas as mensagens?')) clearMessagesMutation.mutate(); }}
          title="Limpar conversa"
        >
          <Eraser className="w-5 h-5" />
        </Button>
        {isGroup && (
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowGroupSettings(true)}>
            <Users className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda</p>
            <p className="text-muted-foreground/50 text-xs mt-1">Mensagens expiram em 7 dias</p>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender === currentUser?.username} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar (text only) */}
      <div className="border-t border-border/50 p-3 bg-background/80 backdrop-blur-lg shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Mensagem..."
            className="rounded-xl flex-1 h-10"
          />

          <Button size="icon" className="rounded-xl h-10 w-10 shrink-0" onClick={handleSend} disabled={sendMutation.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showGroupSettings && (
        <GroupSettingsDialog
          conversation={conversationState}
          currentUser={currentUser?.username}
          isAdmin={isGroupAdmin}
          onConversationUpdated={setConversationState}
          onClose={() => setShowGroupSettings(false)}
          onDeleted={onBack}
        />
      )}
    </div>
  );
}

function ImageFull({ src }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src}
        alt="imagem"
        className="max-w-full max-h-48 object-cover cursor-pointer"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <img src={src} alt="imagem" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
            onClick={() => setOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message, isOwn }) {
  const isText = message.message_type === 'text';
  const isImage = message.message_type === 'image';
  const isVideo = message.message_type === 'video';
  const isAudio = message.message_type === 'audio';
  const isFile = message.message_type === 'file';

  const date = parseDate(message.created_date);
  const dateIsValid = date instanceof Date && !isNaN(date.getTime());

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl overflow-hidden ${isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border/50 rounded-bl-sm'}`}>
        {!isOwn && (
          <p className="text-xs font-semibold px-3 pt-2 pb-0.5 text-primary">{message.sender}</p>
        )}
        {isText && <p className="px-3 py-2 text-sm leading-relaxed">{message.content}</p>}
        {isImage && <ImageFull src={message.content} />}
        {isVideo && <video src={message.content} controls className="max-w-full max-h-48" />}
        {isAudio && (
          <div className="px-3 py-2">
            <audio src={message.content} controls className="w-full h-8" style={{ minWidth: 180 }} />
          </div>
        )}
        {isFile && (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 hover:opacity-80">
            <FileIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs underline truncate">{message.file_name || 'Arquivo'}</span>
          </a>
        )}
        <p className={`text-xs px-3 pb-2 pt-0.5 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {dateIsValid ? format(date, 'HH:mm', { locale: ptBR }) : ''}
        </p>
      </div>
    </div>
  );
}