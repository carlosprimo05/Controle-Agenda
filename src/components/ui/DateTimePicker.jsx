import React, { useState, useEffect } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function DateTimePicker({ value, onChange, placeholder = "Selecionar data e hora" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('date'); // 'date' | 'time'
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d)) {
        setSelectedDate(d);
        setViewDate(d);
        setHour(d.getHours());
        setMinute(d.getMinutes());
      }
    }
  }, []);

  const confirm = () => {
    if (!selectedDate) return;
    const d = new Date(selectedDate);
    d.setHours(hour, minute, 0, 0);
    onChange(format(d, "yyyy-MM-dd'T'HH:mm"));
    setOpen(false);
  };

  const selectDay = (day) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(d);
    setStep('time');
  };

  const daysInMonth = getDaysInMonth(viewDate);
  // Sunday-first: getDay returns 0=Sun,1=Mon...6=Sat
  const firstDaySun = getDay(startOfMonth(viewDate)); // 0=Sun
  const weeks = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const displayValue = value
    ? (() => {
        const d = new Date(value);
        return isNaN(d) ? '' : format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      })()
    : '';

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <>
      <button
        type="button"
        onClick={() => { setStep('date'); setOpen(true); }}
        className="w-full flex items-center gap-2 h-9 px-3 rounded-xl border border-input bg-transparent text-sm shadow-sm text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className={`flex-1 ${displayValue ? 'text-foreground' : 'text-muted-foreground'}`}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <X
            className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onChange(''); setSelectedDate(null); }}
          />
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm w-[calc(100vw-2rem)] mx-auto p-0 overflow-hidden">
          {step === 'date' ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 rounded-lg hover:bg-muted">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold capitalize">
                  {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 rounded-lg hover:bg-muted">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {weeks.map(w => (
                  <div key={w} className="text-center text-xs font-medium text-muted-foreground py-1">{w}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDaySun }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const isSelected = selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === viewDate.getMonth() &&
                    selectedDate.getFullYear() === viewDate.getFullYear();
                  const isToday = new Date().getDate() === day &&
                    new Date().getMonth() === viewDate.getMonth() &&
                    new Date().getFullYear() === viewDate.getFullYear();
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`
                        aspect-square flex items-center justify-center text-sm rounded-xl font-medium transition-colors
                        ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-center text-muted-foreground mt-3">Selecione um dia para escolher o horário</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => setStep('date')} className="p-1.5 rounded-lg hover:bg-muted">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Clock className="w-4 h-4 text-primary" />
                  {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} — Escolha a hora
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium mb-2 text-center">Hora</p>
                  <div className="h-48 overflow-y-auto rounded-xl border border-border">
                    {hours.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHour(h)}
                        className={`w-full py-2 text-sm font-medium transition-colors ${h === hour ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium mb-2 text-center">Minuto</p>
                  <div className="h-48 overflow-y-auto rounded-xl border border-border">
                    {minutes.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMinute(m)}
                        className={`w-full py-2 text-sm font-medium transition-colors ${m === minute ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center text-2xl font-bold text-primary">
                {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
              </div>

              <Button
                type="button"
                onClick={confirm}
                className="w-full mt-3 rounded-xl"
              >
                Confirmar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}