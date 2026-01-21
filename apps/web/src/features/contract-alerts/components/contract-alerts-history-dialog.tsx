import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Mail, XCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Skeleton } from "@acme/ui/skeleton";

import { api } from "~/clients/api-client";
import { useContractAlerts } from "./contract-alerts-provider";

interface SentLog {
  id: string;
  recipientEmail: string;
  sentAt: Date;
  advanceNoticeDays: number;
  status: string;
  errorMessage: string | null;
}

export function ContractAlertsHistoryDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useContractAlerts();

  const { data, isLoading, error } = useQuery({
    queryKey: ["alert-sent-logs", currentRow?.id],
    queryFn: async () => {
      if (!currentRow) return { alertId: "", logs: [] as SentLog[] };
      const response = await api.gas
        .alerts({ alertId: currentRow.id })
        ["sent-logs"].get();
      if (response.error) {
        throw new Error("Failed to fetch sent logs");
      }
      return response.data as { alertId: string; logs: SentLog[] };
    },
    enabled: open === "view-history" && !!currentRow?.id,
  });

  const logs = data?.logs ?? [];

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen ? "view-history" : null);
    if (!isOpen) setCurrentRow(null);
  };

  return (
    <Dialog open={open === "view-history"} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Histórico de Emails Enviados
          </DialogTitle>
          <DialogDescription>
            Registro de todos os emails enviados para o alerta{" "}
            <span className="font-medium">{currentRow?.eventName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="text-destructive mb-2 h-10 w-10" />
              <p className="text-destructive">Erro ao carregar histórico</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="text-muted-foreground mb-2 h-10 w-10" />
              <p className="text-muted-foreground">
                Nenhum email foi enviado para este alerta ainda.
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Os emails serão enviados automaticamente de acordo com a
                configuração de antecedência.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border-border flex items-start gap-3 rounded-lg border p-3"
                  >
                    {log.status === "sent" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {log.recipientEmail}
                        </span>
                        <Badge
                          variant={
                            log.status === "sent" ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {log.status === "sent" ? "Enviado" : "Falhou"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.advanceNoticeDays === 0
                            ? "No dia"
                            : log.advanceNoticeDays === 1
                              ? "1 dia antes"
                              : `${log.advanceNoticeDays} dias antes`}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {format(
                          new Date(log.sentAt),
                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                          {
                            locale: ptBR,
                          },
                        )}
                      </p>
                      {log.errorMessage && (
                        <p className="text-destructive mt-1 text-sm">
                          Erro: {log.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
