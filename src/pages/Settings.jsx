import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLocalAuth } from '@/lib/LocalAuthContext';
import {
  ArrowLeft, Plus, Trash2, User,
  Users, Eye, EyeOff, ShieldCheck, Pencil, Tag, Loader2, Download, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ─── Usuários Locais ────────────────────────────────────────────────────────
function UsersTab() {
  const { createUser, deleteUser, updateUserPassword } = useLocalAuth();
  const queryClient = useQueryClient();

  const { data: users = [], refetch } = useQuery({
    queryKey: ['local-users'],
    queryFn: () => base44.entities.LocalUser.list('username', 500),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [editForm, setEditForm] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const handleCreate = async () => {
    setError('');
    try {
      await createUser(form.username.trim(), form.password, form.role);
      refetch();
      setDialogOpen(false);
      setForm({ username: '', password: '', role: 'user' });
      toast.success('Usuário criado!');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = (u) => {
    setEditForm({ username: u.username, password: u.password, role: u.role });
    setEditError('');
    setShowEditPass(false);
    setEditTarget(u);
  };

  const handleSaveEdit = async () => {
    setEditError('');
    try {
      await updateUserPassword(editTarget.username, editForm.password, editForm.role);
      refetch();
      setEditTarget(null);
      toast.success('Usuário atualizado!');
    } catch (e) {
      setEditError(e.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget);
      refetch();
      setDeleteTarget(null);
      toast.success('Usuário removido!');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => { setError(''); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      {users.map(u => (
        <div key={u.username} className="bg-card rounded-xl border border-border/50 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {u.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{u.username}</p>
            <p className="text-xs text-muted-foreground">{u.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-primary hover:bg-primary/10" onClick={() => handleEdit(u)}>
            <Pencil className="w-4 h-4" />
          </Button>
          {u.username !== 'admin' && (
            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(u.username)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</p>}
            <div>
              <Label className="text-sm">Usuário *</Label>
              <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Nome de usuário" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Senha *</Label>
              <div className="relative mt-1">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Senha"
                  className="rounded-xl pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm">Perfil</Label>
              <div className="flex gap-2 mt-1">
                {['user', 'admin'].map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm(p => ({ ...p, role: r }))}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium border transition-colors ${form.role === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:bg-muted'}`}
                  >
                    {r === 'admin' ? 'Administrador' : 'Usuário'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full rounded-xl h-11" onClick={handleCreate} disabled={!form.username || !form.password}>
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="rounded-2xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle>Editar Usuário: {editTarget?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {editError && <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{editError}</p>}
            <div>
              <Label className="text-sm">Senha</Label>
              <div className="relative mt-1">
                <Input
                  type={showEditPass ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Nova senha"
                  className="rounded-xl pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowEditPass(p => !p)}>
                  {showEditPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm">Perfil</Label>
              <div className="flex gap-2 mt-1">
                {['user', 'admin'].map(r => (
                  <button key={r} type="button"
                    onClick={() => setEditForm(p => ({ ...p, role: r }))}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium border transition-colors ${editForm.role === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:bg-muted'}`}
                  >
                    {r === 'admin' ? 'Administrador' : 'Usuário'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button className="flex-1 rounded-xl" onClick={handleSaveEdit} disabled={!editForm.password}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>Deseja remover o usuário <strong>{deleteTarget}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Tipos de Serviço ───────────────────────────────────────────────────────
function ServiceTypesTab() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => base44.entities.ServiceType.list('name', 200),
  });

  const addMutation = useMutation({
    mutationFn: (name) => base44.entities.ServiceType.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      setInput('');
      toast.success('Tipo adicionado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      setDeleteTarget(null);
      toast.success('Tipo removido!');
    },
  });

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    if (types.find(t => t.name === val)) { toast.error('Tipo já cadastrado!'); return; }
    addMutation.mutate(val);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="Ex: Instalação, Manutenção..."
          className="rounded-xl flex-1"
        />
        <Button size="sm" className="rounded-xl gap-1.5 shrink-0" onClick={handleAdd} disabled={!input.trim() || addMutation.isPending}>
          {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : types.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum tipo cadastrado
        </div>
      ) : (
        types.map(type => (
          <div key={type.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium">{type.name}</span>
            <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(type)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tipo</AlertDialogTitle>
            <AlertDialogDescription>Deseja remover <strong>{deleteTarget?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget?.id)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Backup / Restaurar ─────────────────────────────────────────────────────
function BackupTab() {
  const [restoring, setRestoring] = useState(false);

  const handleBackup = async () => {
    try {
      const [services, installations, serviceTypes, localUsers] = await Promise.all([
        base44.entities.Service.list('-service_date', 5000),
        base44.entities.Installation.list('-scheduled_date', 5000),
        base44.entities.ServiceType.list('name', 500),
        base44.entities.LocalUser.list('username', 500),
      ]);
      const backup = {
        version: 1,
        date: new Date().toISOString(),
        services,
        installations,
        serviceTypes,
        localUsers,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup baixado com sucesso!');
    } catch (e) {
      toast.error('Erro ao fazer backup: ' + e.message);
    }
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setRestoring(true);
      try {
        const backup = JSON.parse(ev.target.result);
        if (!backup.version || !backup.services) throw new Error('Arquivo inválido');

        if (!confirm(`Restaurar backup de ${backup.date?.slice(0,10)}? Isso irá ADICIONAR os dados do backup sem apagar os existentes.`)) {
          setRestoring(false);
          return;
        }

        // Restore service types
        if (backup.serviceTypes?.length) {
          const existing = await base44.entities.ServiceType.list('name', 500);
          for (const t of backup.serviceTypes) {
            if (!existing.find(e => e.name === t.name)) {
              await base44.entities.ServiceType.create({ name: t.name });
            }
          }
        }

        // Restore local users
        if (backup.localUsers?.length) {
          const existing = await base44.entities.LocalUser.list('username', 500);
          for (const u of backup.localUsers) {
            if (!existing.find(e => e.username === u.username)) {
              await base44.entities.LocalUser.create({ username: u.username, password: u.password, role: u.role });
            }
          }
        }

        // Restore services (by client_name + service_date as key)
        if (backup.services?.length) {
          for (const s of backup.services) {
            const { id, created_date, updated_date, created_by, ...data } = s;
            await base44.entities.Service.create(data);
          }
        }

        // Restore installations
        if (backup.installations?.length) {
          for (const i of backup.installations) {
            const { id, created_date, updated_date, created_by, ...data } = i;
            await base44.entities.Installation.create(data);
          }
        }

        toast.success('Backup restaurado com sucesso!');
      } catch (err) {
        toast.error('Erro ao restaurar: ' + err.message);
      }
      setRestoring(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Faça backup de todos os dados do sistema ou restaure a partir de um arquivo.</p>
      <Button
        variant="outline"
        className="w-full rounded-xl h-11 gap-2 text-sm"
        onClick={handleBackup}
      >
        <Download className="w-4 h-4" />
        Fazer Backup
      </Button>
      <label className="block">
        <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
        <Button
          variant="outline"
          className="w-full rounded-xl h-11 gap-2 text-sm"
          disabled={restoring}
          asChild
        >
          <span>
            {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {restoring ? 'Restaurando...' : 'Restaurar Backup'}
          </span>
        </Button>
      </label>
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, logout } = useLocalAuth();

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Configurações</h1>
        <Button variant="outline" size="sm" className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { logout(); navigate('/'); }}>
          Sair
        </Button>
      </div>

      <div className="p-4">
        <div className="bg-primary/10 rounded-xl p-3 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Conectado como: <strong>{currentUser?.username}</strong></span>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Usuários</h2>
            </div>
            <UsersTab />
          </div>

          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Tipos de Serviço</h2>
            </div>
            <ServiceTypesTab />
          </div>

          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Backup & Restaurar</h2>
            </div>
            <BackupTab />
          </div>
        </div>
      </div>
    </div>
  );
}