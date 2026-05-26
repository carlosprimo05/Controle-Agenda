import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  pendente: 'bg-amber-400',
  em_andamento: 'bg-blue-400',
  concluido: 'bg-green-400',
  ausente: 'bg-gray-400',
  cancelado: 'bg-red-400',
};

export default function ServiceCalendar({ services, selectedDate, onDateChange }) {
  const [viewMonth, setViewMonth] = React.useState(() => new Date(selectedDate));

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const servicesByDay = useMemo(() => {
    const map = {};
    services.forEach(s => {
      if (!s.service_date) return;
      const key = format(new Date(s.service_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [services]);

  const prevMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() - 1);
    setViewMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 1);
    setViewMonth(d);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm mx-4 p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-sm capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayServices = servicesByDay[key] || [];
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
          const todayDay = isToday(day);

          // Show max 3 dots
          const dots = dayServices.slice(0, 3);

          return (
            <button
              key={key}
              onClick={() => { onDateChange(day); setViewMonth(new Date(day)); }}
              className={`
                relative flex flex-col items-center justify-start pt-1 pb-1.5 rounded-xl min-h-[44px] transition-all
                ${isSelected ? 'bg-primary text-primary-foreground' : todayDay ? 'bg-primary/10' : 'hover:bg-muted'}
                ${!isCurrentMonth ? 'opacity-30' : ''}
              `}
            >
              <span className={`text-xs font-medium ${isSelected ? 'text-primary-foreground' : todayDay ? 'text-primary font-bold' : ''}`}>
                {format(day, 'd')}
              </span>
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.map((s, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/70' : STATUS_COLORS[s.status] || 'bg-muted-foreground'}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/40">
        {Object.entries({ pendente: 'Pendente', em_andamento: 'Andamento', concluido: 'Concluído' }).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[k]}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}