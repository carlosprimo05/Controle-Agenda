import React, { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar, Wrench, MapPin, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MapPicker from "@/components/services/MapPicker";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { toast } from "sonner";

export default function NewService() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const recurringId = urlParams.get('recurring');

  const { data: editService } = useQuery({
    queryKey: ['service', editId],
    queryFn: async () => {
      const list = await base44.entities.Service.filter({ id: editId });
      return list[0] || null;
    },
    enabled: !!editId,
  });

  const { data: recurringService } = useQuery({
    queryKey: ['recurring', recurringId],
    queryFn: async () => {
      const list = await base44.entities.RecurringService.filter({ id: recurringId });
      return list[0] || null;
    },
    enabled: !!recurringId,
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => base44.entities.ServiceType.list('name', 200),
  });

  const prefill = editService || recurringService;

  const [form, setForm] = useState({
    client_name: '',
    phone: '',
    service_date: '',
    service_type: '',
    address: '',
    latitude: null,
    longitude: null,
    observation: '',
    technician: '',
  });

  const [initialized, setInitialized] = useState(false);

  React.useEffect(() => {
    if (prefill && !initialized) {
      setForm({
        client_name: prefill.client_name || '',
        phone: prefill.phone || '',
        service_date: editService?.service_date ? editService.service_date.slice(0, 16) : '',
        service_type: prefill.service_type || '',
        address: prefill.address || '',
        latitude: prefill.latitude || null,
        longitude: prefill.longitude || null,
        observation: prefill.observation || '',
        technician: prefill.technician || '',
      });
      setInitialized(true);
    }
  }, [prefill, initialized, editService]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço agendado com sucesso!');
      navigate('/');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço atualizado!');
      navigate(`/service/${editId}`);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      client_name: form.client_name,
      phone: form.phone,
      service_date: form.service_date ? new Date(form.service_date).toISOString() : null,
      service_type: form.service_type,
      address: form.address,
      observation: form.observation,
      technician: form.technician,
      status: editService?.status || 'pendente',
    };

    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err) {
      console.error('Erro ao criar/atualizar serviço. payload:', payload);
      console.error('Erro (obj):', err);
      try {
        console.error('Erro (JSON):', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } catch (e) {
        console.error('Falha ao serializar erro:', e);
      }

      // Tentar extrair mensagem útil de vários formatos de erro
      const serverMsg = err?.message || err?.error?.message || err?.response?.data?.message || err?.statusText || (err?.error ? JSON.stringify(err.error) : null);
      const msg = serverMsg || JSON.stringify(err) || 'Erro desconhecido';
      toast.error(`Falha ao salvar serviço: ${msg}`);
    }
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">{editId ? 'Editar Serviço' : 'Novo Serviço'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-8">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Nome do Cliente *</Label>
          <Input value={form.client_name} onChange={(e) => handleChange('client_name', e.target.value)} placeholder="Nome do cliente" required className="rounded-xl" />
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
              handleChange('phone', masked);
            }}
            placeholder="(00) 00000-0000"
            className="rounded-xl"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Data e Hora</Label>
          <DateTimePicker
            value={form.service_date}
            onChange={(val) => handleChange('service_date', val)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" />Tipo do Serviço *</Label>
          {serviceTypes.length === 0 ? (
            <Input value={form.service_type} onChange={(e) => handleChange('service_type', e.target.value)} placeholder="Ex: Instalação, Manutenção..." required className="rounded-xl" />
          ) : (
            <Select value={form.service_type} onValueChange={(v) => handleChange('service_type', v)} required>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Técnico</Label>
          <Input value={form.technician} onChange={(e) => handleChange('technician', e.target.value)} placeholder="Nome do técnico" className="rounded-xl" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Endereço</Label>
          <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Endereço do serviço" className="rounded-xl" />
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onLocationChange={(lat, lng) => {
              handleChange('latitude', lat);
              handleChange('longitude', lng);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Observação</Label>
          <Textarea value={form.observation} onChange={(e) => handleChange('observation', e.target.value)} placeholder="Observações adicionais..." className="rounded-xl" rows={3} />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 text-base font-semibold shadow-lg">
          {isSubmitting ? 'Salvando...' : editId ? 'Salvar Alterações' : 'Agendar Serviço'}
        </Button>
      </form>
    </div>
  );
}