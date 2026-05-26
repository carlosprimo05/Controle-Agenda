import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Clock, Wrench, User, Phone, Calendar, MapPin, MessageSquare, Users, CalendarPlus } from "lucide-react";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Installations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    phone: '',
    scheduled_date: '',
    address: '',
    technician: '',
    observation: '',
  });

  const { data: installations = [], isLoading } = useQuery({
    queryKey: ['installations'],
    queryFn: () => base44.entities.Installation.list('-scheduled_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Installation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast.success('Instalação agendada!');
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Installation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast.success('Instalação removida.');
    },
  });

  const concludeMutation = useMutation({
    mutationFn: (id) => base44.entities.Installation.update(id, { status: 'concluido' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast.success('Instalação concluída!');
    },
  });

  const [fazerHojeItem, setFazerHojeItem] = useState(null);
  const [fazerHojeHora, setFazerHojeHora] = useState('');

  const fazerHojeMutation = useMutation({
    mutationFn: async ({ item, hora }) => {
      const today = new Date();
      let serviceDate;
      if (hora) {
        const [h, m] = hora.split(':').map(Number);
        serviceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0);
      } else {
        serviceDate = today;
      }
      const created = await base44.entities.Service.create({
        client_name: item.client_name,
        phone: item.phone || '',
        service_type: 'Instalação',
        address: item.address || '',
        observation: item.observation || '',
        technician: item.technician || '',
        service_date: serviceDate.toISOString(),
        status: 'pendente',
        installation_id: item.id,
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço adicionado à agenda de hoje!');
      setFazerHojeItem(null);
      setFazerHojeHora('');
    },
  });

  const resetForm = () => {
    setForm({ client_name: '', phone: '', scheduled_date: '', address: '', technician: '', observation: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      client_name: form.client_name,
      phone: form.phone,
      scheduled_date: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
      address: form.address,
      technician: form.technician,
      observation: form.observation,
      status: 'agendado',
    };
    createMutation.mutate(payload);
  };

  const agendados = installations.filter(i => i.status !== 'concluido');
  const concluidos = installations.filter(i => i.status === 'concluido');

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Agendamentos</h1>
          </div>
        </div>
        <Button
          size="sm"
          className="rounded-xl gap-1.5 shadow-md"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Agendados */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Agendados ({agendados.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : agendados.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-border/50">
              <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhuma instalação agendada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendados.map(item => (
                <InstallationCard
                  key={item.id}
                  item={item}
                  onConclude={() => concludeMutation.mutate(item.id)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                  onFazerHoje={() => setFazerHojeItem(item)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Concluídos */}
        {concluidos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Concluídos ({concluidos.length})
              </h2>
            </div>
            <div className="space-y-3">
              {concluidos.map(item => (
                <InstallationCard
                  key={item.id}
                  item={item}
                  concluded
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fazer Hoje Dialog */}
      <Dialog open={!!fazerHojeItem} onOpenChange={(v) => { if (!v) { setFazerHojeItem(null); setFazerHojeHora(''); } }}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-primary" />
              Fazer Hoje
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <p className="text-sm text-muted-foreground">
              Adicionar <strong>{fazerHojeItem?.client_name}</strong> à agenda de serviços de hoje.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Hora</Label>
              <input
                type="time"
                value={fazerHojeHora}
                onChange={(e) => setFazerHojeHora(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setFazerHojeItem(null); setFazerHojeHora(''); }}>Cancelar</Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={!fazerHojeHora || fazerHojeMutation.isPending}
              onClick={() => fazerHojeMutation.mutate({ item: fazerHojeItem, hora: fazerHojeHora })}
            >
              {fazerHojeMutation.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm(); }}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Nova Instalação
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Nome do Cliente *</Label>
              <Input value={form.client_name} onChange={(e) => setForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Nome do cliente" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Celular</Label>
              <Input
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                  let masked = digits;
                  if (digits.length <= 2) masked = digits.length ? `(${digits}` : '';
                  else if (digits.length <= 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  else masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  setForm(p => ({ ...p, phone: masked }));
                }}
                placeholder="(00) 00000-0000"
                className="rounded-xl"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Data e Hora</Label>
              <DateTimePicker
                value={form.scheduled_date}
                onChange={(val) => setForm(p => ({ ...p, scheduled_date: val }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Técnico</Label>
              <Input value={form.technician} onChange={(e) => setForm(p => ({ ...p, technician: e.target.value }))} placeholder="Nome do técnico" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Endereço" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Observação</Label>
              <Textarea value={form.observation} onChange={(e) => setForm(p => ({ ...p, observation: e.target.value }))} placeholder="Observações..." className="rounded-xl" rows={2} />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full rounded-xl h-11 font-semibold shadow-md mt-2">
              {createMutation.isPending ? 'Salvando...' : 'Agendar Instalação'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InstallationCard({ item, concluded, onConclude, onDelete, onFazerHoje }) {
  return (
    <div className={`bg-card rounded-2xl border p-4 space-y-2 transition-all ${concluded ? 'opacity-60 border-border/40' : 'border-border/60 shadow-sm'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full mt-0.5 ${concluded ? 'bg-green-500' : 'bg-amber-400'}`} />
          <p className="font-semibold text-sm leading-tight">{item.client_name}</p>
        </div>
        <Badge variant={concluded ? "secondary" : "outline"} className={`text-xs shrink-0 ${concluded ? 'text-green-600 bg-green-500/10 border-green-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}`}>
          {concluded ? 'Concluído' : 'Agendado'}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 pl-4">
        {item.scheduled_date && (
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {format(new Date(item.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
        {item.technician && (
          <p className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {item.technician}
          </p>
        )}
        {item.address && (
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            {item.address}
          </p>
        )}
        {item.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="w-3 h-3" />
            {item.phone}
          </p>
        )}
        {item.observation && (
          <p className="flex items-center gap-1.5 text-muted-foreground/70 italic">
            <MessageSquare className="w-3 h-3" />
            {item.observation}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-1 flex-wrap">
        {!concluded && onFazerHoje && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
            onClick={onFazerHoje}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Fazer Hoje
          </Button>
        )}
        {!concluded && onConclude && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl h-8 text-xs gap-1.5 text-green-600 border-green-500/30 hover:bg-green-500/10"
            onClick={onConclude}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl h-8 w-8 p-0 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}