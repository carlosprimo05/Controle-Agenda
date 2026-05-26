import React from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function StatsCards({ services }) {
  const agendados = services.length;
  const concluidos = services.filter(s => s.status === "concluido").length;
  const cancelados = services.filter(s => s.status === "cancelado").length;
  const pendentes = services.filter(s => s.status === "pendente").length;

  const stats = [
    { label: "Agendados", value: agendados, icon: CalendarCheck, color: "bg-blue-50 text-blue-600" },
    { label: "Concluídos", value: concluidos, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Pendentes", value: pendentes, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Cancelados", value: cancelados, icon: XCircle, color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card rounded-xl p-2.5 text-center shadow-sm border border-border/50">
          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-1`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}