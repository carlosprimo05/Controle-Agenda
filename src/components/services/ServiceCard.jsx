import React from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MapPin, User, Phone, DollarSign, MessageSquare } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function ServiceCard({ service, onClick }) {
  const hasTime = service.service_date;
  const timeStr = hasTime ? format(new Date(service.service_date), "HH:mm") : null;

  return (
    <button
      onClick={() => onClick(service)}
      className="w-full bg-card rounded-xl p-4 shadow-sm border border-border/50 hover:shadow-md transition-all text-left active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {timeStr && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3" />
                {timeStr}
              </span>
            )}
            <StatusBadge status={service.status} />
          </div>
          <h3 className="font-semibold text-foreground truncate">{service.service_type}</h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{service.client_name}</span>
          </div>
          {service.phone && (
            <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{service.phone}</span>
            </div>
          )}
          {service.address && (
            <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{service.address}</span>
            </div>
          )}
          {service.status === 'concluido' && service.has_cost && service.cost_value != null && (
            <div className="flex items-center gap-1 mt-1 text-sm font-semibold text-emerald-600">
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span>R$ {Number(service.cost_value).toFixed(2)}</span>
              {service.cost_installments > 1 && (
                <span className="text-xs font-normal text-emerald-500">({service.cost_installments}x)</span>
              )}
            </div>
          )}
          {service.status === 'concluido' && service.cost_observation && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground italic">
              <MessageSquare className="w-3 h-3 shrink-0" />
              <span className="truncate">{service.cost_observation}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}