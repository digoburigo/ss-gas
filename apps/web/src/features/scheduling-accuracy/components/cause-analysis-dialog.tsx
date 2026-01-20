import { useState } from "react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import { deviationCauses } from "../data/data";
import { useSchedulingAccuracy } from "./scheduling-accuracy-provider";

type CauseAnalysisDialogProps = {
  onSave: (recordId: string, cause: string, notes: string) => void;
  recordDetails?: {
    date: string;
    unitName: string;
    accuracy: number;
    deviation: number;
  };
};

export function CauseAnalysisDialog({
  onSave,
  recordDetails,
}: CauseAnalysisDialogProps) {
  const { open, setOpen, selectedRecordId, setSelectedRecordId } =
    useSchedulingAccuracy();
  const [selectedCause, setSelectedCause] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const isOpen = open === "cause-analysis";

  const handleClose = () => {
    setOpen(null);
    setSelectedRecordId(null);
    setSelectedCause("");
    setNotes("");
  };

  const handleSave = () => {
    if (!selectedRecordId || !selectedCause) return;
    onSave(selectedRecordId, selectedCause, notes);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Análise de Causa do Desvio</DialogTitle>
          <DialogDescription>
            Registre a causa do desvio para análise e melhoria contínua.
          </DialogDescription>
        </DialogHeader>

        {recordDetails && (
          <div className="bg-muted/50 rounded-md p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Data:</span>{" "}
                <span className="font-medium">
                  {new Date(recordDetails.date).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Unidade:</span>{" "}
                <span className="font-medium">{recordDetails.unitName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Acurácia:</span>{" "}
                <span className="font-medium">
                  {recordDetails.accuracy.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Desvio:</span>{" "}
                <span className="font-medium">
                  {recordDetails.deviation > 0 ? "+" : ""}
                  {recordDetails.deviation.toLocaleString("pt-BR", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  m³
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cause">Causa do Desvio</Label>
            <Select value={selectedCause} onValueChange={setSelectedCause}>
              <SelectTrigger id="cause">
                <SelectValue placeholder="Selecione a causa..." />
              </SelectTrigger>
              <SelectContent>
                {deviationCauses.map((cause) => {
                  const Icon = cause.icon;
                  return (
                    <SelectItem key={cause.value} value={cause.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{cause.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedCause && (
              <p className="text-muted-foreground text-xs">
                {
                  deviationCauses.find((c) => c.value === selectedCause)
                    ?.description
                }
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Descreva detalhes adicionais sobre o desvio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!selectedCause}>
            Salvar Análise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
