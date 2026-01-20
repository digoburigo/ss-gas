import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Textarea } from "@acme/ui/textarea";
import { Label } from "@acme/ui/label";

import { useDeviationAlerts } from "./deviation-alerts-provider";
import type { DeviationAlert } from "./deviation-alerts-table";

type AcknowledgeDialogProps = {
  alert?: DeviationAlert;
  onAcknowledge: (alertId: string, notes: string) => void;
};

export function AcknowledgeDialog({
  alert,
  onAcknowledge,
}: AcknowledgeDialogProps) {
  const { open, setOpen } = useDeviationAlerts();
  const [notes, setNotes] = useState("");
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    if (!alert) return;

    setIsAcknowledging(true);
    try {
      onAcknowledge(alert.id, notes);
      toast.success("Alerta reconhecido com sucesso");
      setOpen(null);
    } catch {
      toast.error("Erro ao reconhecer alerta");
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(null);
      setNotes("");
    }
  };

  return (
    <Dialog open={open === "acknowledge"} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Reconhecer Alerta
          </DialogTitle>
          <DialogDescription>
            Reconheça o alerta para indicar que foi visualizado e está sendo
            tratado.
          </DialogDescription>
        </DialogHeader>

        {alert && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="text-sm">
                <p>
                  <strong>Unidade:</strong> {alert.unitName} ({alert.unitCode})
                </p>
                <p>
                  <strong>Data:</strong>{" "}
                  {new Date(alert.date).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </p>
                <p>
                  <strong>Desvio:</strong>{" "}
                  <span
                    className={
                      alert.deviationPercent > 0
                        ? "text-red-600"
                        : "text-blue-600"
                    }
                  >
                    {alert.deviationPercent > 0 ? "+" : ""}
                    {alert.deviationPercent.toFixed(1)}%
                  </span>
                </p>
                <p>
                  <strong>Programado:</strong>{" "}
                  {alert.scheduled.toLocaleString("pt-BR")} m³
                </p>
                <p>
                  <strong>Realizado:</strong>{" "}
                  {alert.actual.toLocaleString("pt-BR")} m³
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o alerta..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(null)}
            disabled={isAcknowledging}
          >
            Cancelar
          </Button>
          <Button onClick={handleAcknowledge} disabled={isAcknowledging}>
            {isAcknowledging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reconhecendo...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Reconhecer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
