import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function ConcluirDialog({ open, onOpenChange, onConfirm }) {
  const [hasCost, setHasCost] = useState(null); // null = not chosen yet
  const [value, setValue] = useState('');
  const [installments, setInstallments] = useState('1');
  const [paymentDate, setPaymentDate] = useState(null);
  const [costObs, setCostObs] = useState('');

  const totalValue = parseFloat(value) || 0;
  const numInstallments = parseInt(installments) || 1;
  const installmentValue = numInstallments > 0 && totalValue > 0
    ? (totalValue / numInstallments).toFixed(2)
    : null;

  const resetState = () => {
    setHasCost(null);
    setValue('');
    setInstallments('1');
    setPaymentDate(null);
    setCostObs('');
  };

  const handleConfirm = async () => {
    const costData = hasCost
      ? {
        has_cost: true,
        cost_value: totalValue,
        cost_installments: numInstallments,
        cost_payment_date: paymentDate ? format(paymentDate, 'yyyy-MM-dd') : null,
        cost_observation: costObs,
      }
      : { has_cost: false };

    try {
      await onConfirm(costData);
      resetState();
    } catch (error) {
      console.error('Erro ao concluir serviço:', error);
      try {
        console.error('Erro ao concluir serviço (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (e) {
        console.error('Falha ao serializar erro:', e);
      }
      toast.error(`Erro ao concluir serviço: ${error?.message || 'verifique o console'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => {
      if (!openState) resetState();
      onOpenChange(openState);
    }}>
      <DialogContent className="rounded-2xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Concluir Serviço
          </DialogTitle>
        </DialogHeader>

        {hasCost === null ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground text-center">Houve algum custo neste serviço?</p>
            <div className="flex gap-3">
              <Button className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700" onClick={() => setHasCost(true)}>
                Sim, houve custo
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setHasCost(false)}>
                Não
              </Button>
            </div>
          </div>
        ) : hasCost ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Valor Total (R$) *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="0,00"
                  className="rounded-xl pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Parcelas</Label>
              <Input
                type="number"
                min="1"
                max="48"
                value={installments}
                onChange={e => setInstallments(e.target.value)}
                className="rounded-xl mt-1"
              />
              {installmentValue && (
                <p className="text-xs text-emerald-600 font-medium mt-1.5 bg-emerald-50 rounded-lg px-3 py-1.5">
                  {numInstallments}x de R$ {installmentValue}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Data do Pagamento</Label>
              <div className="mt-1 rounded-2xl border border-border overflow-hidden bg-card">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  locale={ptBR}
                  className="w-full"
                />
              </div>
              {paymentDate && (
                <p className="text-xs text-primary font-medium mt-1.5 text-center">
                  {format(paymentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Observações</Label>
              <Textarea
                value={costObs}
                onChange={e => setCostObs(e.target.value)}
                placeholder="Detalhes do custo..."
                className="rounded-xl mt-1"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setHasCost(null)}>Voltar</Button>
              <Button type="button" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirm} disabled={totalValue <= 0}>
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground text-center mb-4">Nenhum custo registrado.</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setHasCost(null)}>Voltar</Button>
              <Button type="button" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirm}>
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}