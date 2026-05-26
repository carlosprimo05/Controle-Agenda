import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Tag } from "lucide-react";

const statusOptions = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "ausente", label: "Ausente" },
  { value: "cancelado", label: "Cancelado" },
];

export default function ServiceFilters({ statusFilter, serviceTypeFilter = "todos", onStatusChange, onServiceTypeChange }) {
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => base44.entities.ServiceType.list('name', 200),
  });
  return (
    <div className="flex gap-2 px-4">
      <div className="flex-1">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 rounded-xl text-sm bg-card">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Select value={serviceTypeFilter} onValueChange={onServiceTypeChange}>
          <SelectTrigger className="h-9 rounded-xl text-sm bg-card">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue placeholder="Tipo" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            {serviceTypes.map(t => (
              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}