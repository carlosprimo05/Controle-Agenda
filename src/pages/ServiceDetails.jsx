import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocalAuth } from '@/lib/LocalAuthContext';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, User, Phone, Calendar, Wrench, MapPin,
  MessageSquare, Pencil, CheckCircle2, Loader2, UserX,
  Clock, XCircle, Users, Navigation, DollarSign, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/services/StatusBadge";
import MapPicker from "@/components/services/MapPicker";
import CancelDialog from "@/components/services/CancelDialog";
import ConcluirDialog from "@/components/services/ConcluirDialog";
import { toast } from "sonner";

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useLocalAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [cancelOpen, setCancelOpen] = useState(false);
  const [concluirOpen, setConcluirOpen] = useState(false);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => base44.entities.Service.filter({ id }).then(list => list[0] || null),
    staleTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleStatusChange = (status) => {
    updateMutation.mutate({ status, status_changed_by: currentUser?.username });
    toast.success(`Status atualizado`);
  };

  const handleConcluir = async (costData) => {
    await updateMutation.mutateAsync({
      status: 'concluido',
      status_changed_by: currentUser?.username,
      ...costData,
    });
    // Se veio de uma instalação, marca ela como concluída também
    if (service.installation_id) {
      await base44.entities.Installation.update(service.installation_id, { status: 'concluido' });
      queryClient.invalidateQueries({ queryKey: ['installations'] });
    }
    setConcluirOpen(false);
    toast.success('Serviço concluído!');
  };

  const handleCancel = (reason) => {
    updateMutation.mutate({ status: 'cancelado', cancel_reason: reason, status_changed_by: currentUser?.username });
    setCancelOpen(false);
    toast.success('Serviço cancelado');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Serviço não encontrado</p>
      </div>
    );
  }

  const details = [
    { icon: User, label: "Cliente", value: service.client_name },
    { icon: Phone, label: "Celular", value: service.phone, href: service.phone ? `tel:${service.phone}` : null },
    { icon: Calendar, label: "Data/Hora", value: service.service_date ? format(new Date(service.service_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Não definido" },
    { icon: Wrench, label: "Tipo", value: service.service_type },
    { icon: Users, label: "Técnico", value: service.technician || "Não definido" },
    { icon: MapPin, label: "Endereço", value: service.address || "Não definido" },
    { icon: MessageSquare, label: "Observação", value: service.observation || "Nenhuma" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Detalhes do Serviço</h1>
        <StatusBadge status={service.status} size="lg" />
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
          <XCircle className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Details card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 space-y-4">
          {details.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                {href ? (
                  <a href={href} className="text-sm font-medium text-primary underline">{value}</a>
                ) : (
                  <p className="text-sm font-medium text-foreground">{value}</p>
                )}
              </div>
            </div>
          ))}

          {service.status_changed_by && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Status alterado por: <span className="font-medium text-foreground">{service.status_changed_by}</span></p>
            </div>
          )}

          {service.cancel_reason && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-red-500 font-medium">Motivo do cancelamento</p>
                <p className="text-sm text-red-700">{service.cancel_reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Cost info — admin only */}
        {isAdmin && service.has_cost && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-emerald-700">Informações de Custo</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Valor Total</p>
                <p className="text-sm font-bold text-emerald-800">R$ {service.cost_value?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium">Parcelas</p>
                <p className="text-sm font-bold text-emerald-800">
                  {service.cost_installments}x de R$ {(service.cost_value / service.cost_installments).toFixed(2)}
                </p>
              </div>
              {service.cost_payment_date && (
                <div className="col-span-2">
                  <p className="text-xs text-emerald-600 font-medium">Data do Pagamento</p>
                  <p className="text-sm font-semibold text-emerald-800">
                    {format(new Date(service.cost_payment_date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              {service.cost_observation && (
                <div className="col-span-2">
                  <p className="text-xs text-emerald-600 font-medium">Observação</p>
                  <p className="text-sm text-emerald-800">{service.cost_observation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        {service.latitude && service.longitude && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Localização</h3>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                  <Navigation className="w-3.5 h-3.5" /> Navegar
                </Button>
              </a>
            </div>
            <MapPicker latitude={service.latitude} longitude={service.longitude} readOnly />
          </div>
        )}

        {/* Status actions */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 space-y-3">
          <h3 className="font-semibold text-sm mb-2">Alterar Status</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-xl h-11 gap-2 text-sm border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => handleStatusChange('pendente')}>
              <Clock className="w-4 h-4" /> Pendente
            </Button>
            <Button variant="outline" className="rounded-xl h-11 gap-2 text-sm border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleStatusChange('em_andamento')}>
              <Loader2 className="w-4 h-4" /> Em Andamento
            </Button>
            <Button variant="outline" className="rounded-xl h-11 gap-2 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 col-span-2" onClick={() => setConcluirOpen(true)}>
              <CheckCircle2 className="w-4 h-4" /> Concluído
            </Button>
            <Button variant="outline" className="rounded-xl h-11 gap-2 text-sm border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => handleStatusChange('ausente')}>
              <UserX className="w-4 h-4" /> Ausente
            </Button>
            <Button variant="outline" className="rounded-xl h-11 gap-2 text-sm border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCancelOpen(true)}>
              <XCircle className="w-4 h-4" /> Cancelar
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-12 gap-2" onClick={() => navigate(`/new-service?edit=${service.id}`)}>
            <Pencil className="w-4 h-4" /> Editar
          </Button>
          <Button className="flex-1 rounded-xl h-12 gap-2" onClick={() => navigate(`/new-service?edit=${service.id}`)}>
            <Calendar className="w-4 h-4" /> Reagendar
          </Button>
        </div>
      </div>

      <CancelDialog open={cancelOpen} onOpenChange={setCancelOpen} onConfirm={handleCancel} />
      <ConcluirDialog open={concluirOpen} onOpenChange={setConcluirOpen} onConfirm={handleConcluir} />
    </div>
  );
}