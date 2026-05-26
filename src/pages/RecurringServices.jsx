import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RotateCcw, Trash2, CalendarPlus, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function RecurringServices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', service_type: '', client_name: '', phone: '',
    address: '', observation: '', technician: '',
  });

  const { data: recurring = [], isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => base44.entities.RecurringService.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecurringService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      setDialogOpen(false);
      resetForm();
      toast.success('Serviço recorrente criado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      toast.success('Removido!');
    },
  });

  const resetForm = () => setForm({
    name: '', service_type: '', client_name: '', phone: '',
    address: '', observation: '', technician: '',
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Serviços Recorrentes</h1>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : recurring.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum serviço recorrente</p>
            <p className="text-muted-foreground text-xs mt-1">Crie templates para agilizar agendamentos</p>
          </div>
        ) : (
          recurring.map(item => (
            <div key={item.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{item.service_type}</span>
                  </div>
                  {item.client_name && (
                    <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>{item.client_name}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg h-9 w-9"
                    onClick={() => navigate(`/new-service?recurring=${item.id}`)}
                  >
                    <CalendarPlus className="w-4 h-4 text-primary" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg h-9 w-9"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl mx-4 max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Serviço Recorrente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Nome do Template *</Label>
              <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Ex: Manutenção mensal - Cliente X" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Tipo do Serviço *</Label>
              <Input value={form.service_type} onChange={(e) => handleChange('service_type', e.target.value)} placeholder="Tipo do serviço" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Cliente</Label>
              <Input value={form.client_name} onChange={(e) => handleChange('client_name', e.target.value)} placeholder="Nome do cliente" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Celular</Label>
              <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Celular" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Técnico</Label>
              <Input value={form.technician} onChange={(e) => handleChange('technician', e.target.value)} placeholder="Técnico" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Endereço</Label>
              <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Endereço" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-sm">Observação</Label>
              <Textarea value={form.observation} onChange={(e) => handleChange('observation', e.target.value)} placeholder="Observações" className="rounded-xl mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full rounded-xl h-11"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || !form.service_type || createMutation.isPending}
            >
              {createMutation.isPending ? 'Salvando...' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}