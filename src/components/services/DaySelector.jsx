import React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DaySelector({ selectedDate, onDateChange, viewMode, onViewModeChange }) {
  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const goToday = () => onDateChange(new Date());

  const getLabel = () => {
    if (isToday(selectedDate)) return "Hoje";
    if (isTomorrow(selectedDate)) return "Amanhã";
    if (isYesterday(selectedDate)) return "Ontem";
    return null;
  };

  const label = getLabel();

  return (
    <div className="bg-primary text-primary-foreground rounded-2xl p-4 mx-4 mt-4 shadow-lg">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goBack} className="text-primary-foreground hover:bg-white/20 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <button onClick={goToday} className="text-center flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 opacity-80" />
            {label && <span className="text-sm font-semibold opacity-90">{label}</span>}
          </div>
          <span className="text-lg font-bold capitalize">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goForward} className="text-primary-foreground hover:bg-white/20 rounded-xl">
            <ChevronRight className="w-5 h-5" />
          </Button>
          {onViewModeChange && (
            <button
              onClick={() => onViewModeChange(viewMode === 'calendar' ? 'list' : 'calendar')}
              className="p-1 rounded-lg hover:bg-white/20 opacity-80 hover:opacity-100"
              title={viewMode === 'calendar' ? 'Ver lista' : 'Ver calendário'}
            >
              {viewMode === 'calendar' ? <List className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}