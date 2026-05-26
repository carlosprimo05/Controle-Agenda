import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalAuth } from '@/lib/LocalAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function NewConversationDialog({ open, onClose, currentUser, onCreated }) {
  const { getUsers } = useLocalAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('direct'); // 'direct' | 'group'
  const [selectedUser, setSelectedUser] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (open) {
      getUsers().then(users => setAllUsers(users.filter(u => u.username !== currentUser)));
    }
  }, [open, currentUser]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatConversation.create(data),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(mode === 'group' ? 'Grupo criado!' : 'Conversa iniciada!');
      onCreated(conv);
    },
  });

  const handleCreate = () => {
    if (mode === 'direct') {
      if (!selectedUser) return toast.error('Selecione um usuário');
      createMutation.mutate({
        type: 'direct',
        participants: [currentUser, selectedUser],
        created_by: currentUser,
      });
    } else {
      if (!groupName.trim()) return toast.error('Informe o nome do grupo');
      if (selectedUsers.length === 0) return toast.error('Adicione ao menos um participante');
      createMutation.mutate({
        type: 'group',
        name: groupName.trim(),
        participants: [currentUser, ...selectedUsers],
        created_by: currentUser,
      });
    }
  };

  const toggleUser = (u) => {
    setSelectedUsers(prev =>
      prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
    );
  };

  const reset = () => {
    setMode('direct'); setSelectedUser(''); setGroupName(''); setSelectedUsers([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="rounded-2xl max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        {/* Mode selector */}
        <div className="flex gap-2">
          {[{ id: 'direct', icon: User, label: 'Direto' }, { id: 'group', icon: Users, label: 'Grupo' }].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium border transition-colors
                ${mode === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'direct' ? (
          <div className="space-y-2">
            <Label className="text-sm">Selecione o usuário</Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {allUsers.map(u => (
                <button
                  key={u.username}
                  onClick={() => setSelectedUser(u.username)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${selectedUser === u.username ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-muted'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium flex-1 text-left">{u.username}</span>
                  {selectedUser === u.username && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Nome do grupo *</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ex: Equipe Técnica" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Participantes</Label>
              <div className="space-y-1.5 mt-1.5 max-h-40 overflow-y-auto">
                {allUsers.map(u => (
                  <button
                    key={u.username}
                    onClick={() => toggleUser(u.username)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all
                      ${selectedUsers.includes(u.username) ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-muted'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium flex-1 text-left">{u.username}</span>
                    {selectedUsers.includes(u.username) && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button
          className="w-full rounded-xl h-11"
          onClick={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Criando...' : mode === 'group' ? 'Criar Grupo' : 'Iniciar Conversa'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}