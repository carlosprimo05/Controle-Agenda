import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ServiceCard from "@/components/services/ServiceCard";

export default function History() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("concluido");
  const [search, setSearch] = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('-service_date', 500),
  });

  const filtered = useMemo(() => {
    const minDate = subDays(new Date(), 20);
    let list = services.filter(s => s.status === tab && s.service_date && new Date(s.service_date) >= minDate);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.client_name?.toLowerCase().includes(q) ||
        s.service_type?.toLowerCase().includes(q) ||
        s.technician?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, tab, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(s => {
      const key = s.service_date ? format(new Date(s.service_date), "yyyy-MM-dd") : "sem-data";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">Histórico</h1>
      </div>

      <div className="p-4 space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full rounded-xl bg-muted">
            <TabsTrigger value="concluido" className="flex-1 rounded-lg text-sm">Concluídos</TabsTrigger>
            <TabsTrigger value="cancelado" className="flex-1 rounded-lg text-sm">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">Exibindo registros dos últimos 20 dias.</p>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, serviço ou técnico..."
            className="pl-9 rounded-xl bg-card"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhum registro encontrado</p>
          </div>
        ) : (
          grouped.map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {date === "sem-data" ? "Sem data" : format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <div className="space-y-2">
                {items.map(s => (
                  <div key={s.id}>
                    <ServiceCard service={s} onClick={(svc) => navigate(`/service/${svc.id}`)} />
                    {s.status_changed_by && (
                      <p className="text-xs text-muted-foreground mt-1 ml-1 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                        Status alterado por: <span className="font-medium">{s.status_changed_by}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}