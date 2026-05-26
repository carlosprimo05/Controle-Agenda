import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2, UserX, XCircle, AlertTriangle } from "lucide-react";

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200" },
  em_andamento: { label: "Em Andamento", icon: Loader2, className: "bg-blue-100 text-blue-700 border-blue-200" },
  concluido: { label: "Concluído", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ausente: { label: "Ausente", icon: UserX, className: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
  atrasado: { label: "Atrasado", icon: AlertTriangle, className: "bg-orange-100 text-orange-700 border-orange-200" },
};

export default function StatusBadge({ status, size = "sm" }) {
  const config = statusConfig[status] || statusConfig.pendente;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} border font-medium gap-1 ${size === "lg" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5"}`}>
      <Icon className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
      {config.label}
    </Badge>
  );
}