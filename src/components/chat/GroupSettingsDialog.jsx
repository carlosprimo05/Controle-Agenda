import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalAuth } from '@/lib/LocalAuthContext';
import { X, UserPlus, UserMinus, Trash2, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function GroupSettingsDialog({ conversation, currentUser, isAdmin, onClose, onDeleted, onConversationUpdated }) {
  const { getUsers } = useLocalAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('members');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    getUsers().then(users => {
      setAllUsers(users.filter(u => !conversation.participants?.includes(u.username)));
    });
  }, [conversation.participants]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatConversation.update(conversation.id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (onConversationUpdated) onConversationUpdated(updated);
    },
    onError: (error) => {
      console.error('Erro ao atualizar conversa:', error);
      toast.error('Não foi possível atualizar o grupo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ChatConversation.delete(conversation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Grupo excluído');
      onDeleted();
    },
  });

  const handleRemove = (username) => {
    const updated = conversation.participants.filter(p => p !== username);
    updateMutation.mutate({ participants: updated }, {
      onSuccess: () => toast.success(`${username} removido`),
    });
  };

  const handleAdd = (username) => {
    updateMutation.mutate({ participants: [...conversation.participants, username] }, {
      onSuccess: () => toast.success(`${username} adicionado`),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-background w-full rounded-t-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base">{conversation.name}</h2>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 pb-0">
          {[{ id: 'members', label: 'Participantes' }, { id: 'add', label: 'Adicionar' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium border transition-colors
                ${tab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tab === 'members' ? (
            <>
              {conversation.participants?.map(username => (
                <div key={username} className="flex items-center gap-3 bg-card rounded-xl border border-border/50 p-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium flex-1">{username}</span>
                  {username === conversation.created_by && (
                    <span className="text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">Admin</span>
                  )}
                  {isAdmin && username !== currentUser && username !== conversation.created_by && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(username)}
                      disabled={updateMutation.isPending}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              {allUsers.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Todos os usuários já estão no grupo</p>
              ) : allUsers.map(u => (
                <div key={u.username} className="flex items-center gap-3 bg-card rounded-xl border border-border/50 p-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium flex-1">{u.username}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                    onClick={() => handleAdd(u.username)}
                    disabled={updateMutation.isPending}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Delete group */}
        {isAdmin && (
          <div className="p-4 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
              Excluir Grupo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}