import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
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
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";

import { useDeviationAlerts } from "./deviation-alerts-provider";
import type { DeviationAlert } from "./deviation-alerts-table";

type SendEmailDialogProps = {
  alert?: DeviationAlert;
  onSend: (alertId: string, recipients: string[], message: string) => void;
  unitResponsibleEmails?: string[];
};

export function SendEmailDialog({
  alert,
  onSend,
  unitResponsibleEmails = [],
}: SendEmailDialogProps) {
  const { open, setOpen } = useDeviationAlerts();
  const [recipients, setRecipients] = useState(unitResponsibleEmails.join(", "));
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!alert) return;

    const recipientList = recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (recipientList.length === 0) {
      toast.error("Adicione pelo menos um destinatário");
      return;
    }

    setIsSending(true);
    try {
      onSend(alert.id, recipientList, additionalMessage);
      toast.success("E-mail de alerta enviado com sucesso");
      setOpen(null);
    } catch {
      toast.error("Erro ao enviar e-mail de alerta");
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(null);
      setRecipients(unitResponsibleEmails.join(", "));
      setAdditionalMessage("");
    }
  };

  return (
    <Dialog open={open === "send-email"} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Alerta por E-mail
          </DialogTitle>
          <DialogDescription>
            Envie um e-mail de alerta para os responsáveis pela unidade.
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Destinatários</Label>
              <Input
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email@exemplo.com, outro@exemplo.com"
              />
              <p className="text-muted-foreground text-xs">
                Separe múltiplos e-mails com vírgula
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem Adicional (opcional)</Label>
              <Textarea
                id="message"
                value={additionalMessage}
                onChange={(e) => setAdditionalMessage(e.target.value)}
                placeholder="Adicione uma mensagem personalizada ao alerta..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(null)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Alerta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
