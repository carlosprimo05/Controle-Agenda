import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, Phone, Calendar, CreditCard, MessageSquare, CheckCircle2, Search, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Lancamentos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-lancamentos'],
    queryFn: () => base44.entities.Service.list('-service_date', 1000),
  });

  const cutoff15 = subDays(new Date(), 15);

  // Lançamentos pendentes (has_cost = true)
  const withCost = useMemo(() => {
    let list = services.filter(s => s.status === 'concluido' && s.has_cost && s.cost_value != null);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.client_name?.toLowerCase().includes(q) ||
        s.service_type?.toLowerCase().includes(q) ||
        s.technician?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, search]);

  // Histórico: concluídos sem has_cost nos últimos 15 dias
  const history = useMemo(() => {
    let list = services.filter(s =>
      s.status === 'concluido' && !s.has_cost && s.cost_value != null &&
      new Date(s.service_date || s.updated_date) >= cutoff15
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.client_name?.toLowerCase().includes(q) ||
        s.service_type?.toLowerCase().includes(q) ||
        s.technician?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, search]);

  const totalGeral = withCost.reduce((acc, s) => acc + (Number(s.cost_value) || 0), 0);

  const concludeMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.update(id, { has_cost: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Lançamento concluído!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Lançamento excluído!');
    },
  });

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <DollarSign className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Lançamentos</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-bold text-emerald-600">R$ {totalGeral.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, serviço..."
            className="pl-9 rounded-xl bg-card"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : withCost.length === 0 && !showHistory ? (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum lançamento pendente</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Serviços concluídos com custo aparecerão aqui</p>
          </div>
        ) : (
          withCost.map(s => (
            <LancamentoCard
              key={s.id}
              service={s}
              onConclude={() => concludeMutation.mutate(s.id)}
              onDelete={() => deleteMutation.mutate(s.id)}
            />
          ))
        )}

        {/* Histórico 15 dias */}
        {history.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowHistory(p => !p)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <History className="w-3.5 h-3.5" />
              {showHistory ? 'Ocultar' : 'Ver'} histórico (últimos 15 dias · {history.length})
            </button>
            {showHistory && (
              <div className="space-y-3 mt-2">
                {history.map(s => (
                  <LancamentoCard
                    key={s.id}
                    service={s}
                    concluded
                    onDelete={() => deleteMutation.mutate(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LancamentoCard({ service: s, onConclude, onDelete, concluded = false }) {
  return (
    <div className={`bg-card rounded-2xl border shadow-sm p-4 space-y-3 ${concluded ? 'opacity-60 border-border/40' : 'border-border/60'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{s.client_name}</p>
          <p className="text-xs text-muted-foreground">{s.service_type}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-emerald-600">R$ {Number(s.cost_value).toFixed(2)}</p>
          {s.cost_installments > 1 && (
            <p className="text-xs text-emerald-500">{s.cost_installments}x parcelas</p>
          )}
        </div>
      </div>

      {/* Detalhes */}
      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
        {s.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{s.phone}</span>
          </div>
        )}
        {s.service_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Serviço: {format(new Date(s.service_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        )}
        {s.cost_payment_date && (
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="font-medium text-foreground">Pgto: {format(new Date(s.cost_payment_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
        {s.cost_installments > 1 && (
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>{s.cost_installments}x de R$ {(Number(s.cost_value) / s.cost_installments).toFixed(2)}</span>
          </div>
        )}
        {s.cost_observation && (
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="italic">{s.cost_observation}</span>
          </div>
        )}
        {s.technician && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>{s.technician}</span>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-2">
        {!concluded && onConclude && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl h-9 text-xs gap-1.5 text-green-600 border-green-500/30 hover:bg-green-500/10"
            onClick={onConclude}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluído
          </Button>
        )}
        {concluded && (
          <Badge variant="outline" className="text-xs text-green-600 border-green-500/20 bg-green-500/10">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Concluído
          </Badge>
        )}
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl h-9 w-9 p-0 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}