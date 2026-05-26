import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CancelDialog({ open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl mx-4 max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
          <AlertDialogDescription>
            Descreva o motivo do cancelamento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label className="text-sm font-medium">Motivo</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o motivo do cancelamento..."
            className="mt-1.5 rounded-xl"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirmar Cancelamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}