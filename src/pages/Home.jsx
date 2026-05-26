import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, History, Settings, Wrench, LogOut, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalAuth } from '@/lib/LocalAuthContext';
import { format, startOfDay, endOfDay } from "date-fns";
import DaySelector from "@/components/services/DaySelector";
import StatsCards from "@/components/services/StatsCards";
import ServiceFilters from "@/components/services/ServiceFilters";
import ServiceCard from "@/components/services/ServiceCard";
import ServiceCalendar from "@/components/calendar/ServiceCalendar";
import ChatButton from "@/components/chat/ChatButton";

export default function Home() {
  const { currentUser, logout } = useLocalAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === 'admin';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("todos");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("todos");
  const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('-service_date', 500),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const unsubscribe = base44.entities.Service.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const dayServices = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    return services.filter(s => {
      if (!s.service_date) return false;
      const d = new Date(s.service_date);
      return d >= dayStart && d <= dayEnd;
    });
  }, [services, selectedDate]);

  const filteredServices = useMemo(() => {
    let list = dayServices;
    if (statusFilter === "todos") {
      // Always hide concluded and cancelled from home screen when no specific status filter is selected
      list = list.filter(s => s.status !== 'concluido' && s.status !== 'cancelado');
    } else {
      list = list.filter(s => s.status === statusFilter);
    }
    if (serviceTypeFilter !== "todos") list = list.filter(s => s.service_type === serviceTypeFilter);
    return list.sort((a, b) => {
      if (!a.service_date) return 1;
      if (!b.service_date) return -1;
      return new Date(a.service_date) - new Date(b.service_date);
    });
  }, [dayServices, statusFilter, serviceTypeFilter]);

  // Auto-atualiza status para "atrasado" se horário passou e ainda está pendente
  // NUNCA altera "em_andamento" — serviço sendo realizado não vira atrasado
  useEffect(() => {
    const now = new Date();
    const outdated = services.filter(s =>
      s.status === 'pendente' &&
      s.service_date && new Date(s.service_date) < now
    );
    if (outdated.length === 0) return;
    Promise.all(outdated.map(s =>
      base44.entities.Service.update(s.id, { status: 'atrasado' })
    )).then(() => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    });
  }, [services.map(s => s.id + s.status).join()]);

  const handleServiceClick = (service) => {
    navigate(`/service/${service.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar with logout */}
      <div className="flex items-center justify-end px-4 pt-4 pb-1 gap-2">
        {currentUser?.username && (
          <span className="text-sm text-muted-foreground font-medium">{currentUser.username}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => { logout(); }}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>

      <DaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} viewMode={viewMode} onViewModeChange={setViewMode} />

      {viewMode === 'calendar' ? (
        <div className="mt-3">
          <ServiceCalendar
            services={services}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <div className="px-4 mt-4 space-y-3">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Nenhum serviço neste dia</p>
              </div>
            ) : (
              filteredServices.map(service => (
                <ServiceCard key={service.id} service={service} onClick={handleServiceClick} />
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <StatsCards services={dayServices} />
          </div>
          <div className="mt-4">
            <ServiceFilters
              statusFilter={statusFilter}
              serviceTypeFilter={serviceTypeFilter}
              onStatusChange={setStatusFilter}
              onServiceTypeChange={setServiceTypeFilter}
            />
          </div>
          <div className="px-4 mt-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Nenhum serviço encontrado</p>
              </div>
            ) : (
              filteredServices.map(service => (
                <ServiceCard key={service.id} service={service} onClick={handleServiceClick} />
              ))
            )}
          </div>
        </>
      )}

      {/* Chat floating button */}
      <ChatButton />

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 px-2 py-2 bg-background/80 backdrop-blur-lg border-t border-border/50 flex gap-1 z-10">
        <Link to="/history" className="flex-1">
          <Button variant="outline" className="w-full rounded-xl h-10 gap-0.5 text-xs px-1.5">
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Histórico</span>
          </Button>
        </Link>
        <Link to="/installations" className="flex-1">
          <Button variant="outline" className="w-full rounded-xl h-10 gap-0.5 text-xs px-1.5">
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Instalações</span>
          </Button>
        </Link>
        {isAdmin && (
          <Link to="/lancamentos" className="flex-1">
            <Button variant="outline" className="w-full rounded-xl h-10 gap-0.5 text-xs px-1.5">
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Lançar</span>
            </Button>
          </Link>
        )}
        {isAdmin && (
          <Link to="/settings" className="shrink-0">
            <Button variant="outline" className="rounded-xl h-10 w-9 p-0">
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
        <Link to="/new-service" className="flex-1">
          <Button className="w-full rounded-xl h-10 gap-0.5 text-xs px-1.5 bg-primary hover:bg-primary/90 shadow-lg">
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Novo</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}