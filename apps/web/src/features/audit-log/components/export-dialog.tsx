import { useState } from "react";
import { Download } from "lucide-react";

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

import type { AuditLogEntry } from "./audit-log-table";
import { api } from "~/clients/api-client";
import { convertToCSV, convertToJSON, exportFormats } from "../data/data";
import { useAuditLog } from "./audit-log-provider";

type ExportDialogProps = {
  logs: AuditLogEntry[];
};

export function ExportDialog({ logs }: ExportDialogProps) {
  const {
    open,
    setOpen,
    dateRange,
    selectedEntityType,
    selectedAction,
    selectedUserId,
  } = useAuditLog();
  const [format, setFormat] = useState<"xlsx" | "csv" | "json">("xlsx");
  const [isExporting, setIsExporting] = useState(false);

  const isOpen = open === "export";

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (format === "xlsx") {
        // Use server endpoint for Excel export
        const queryParams: Record<string, string> = {};
        if (dateRange.start)
          queryParams.startDate = dateRange.start.toISOString();
        if (dateRange.end) queryParams.endDate = dateRange.end.toISOString();
        if (selectedEntityType) queryParams.entityType = selectedEntityType;
        if (selectedAction) queryParams.action = selectedAction;
        if (selectedUserId) queryParams.userId = selectedUserId;

        const response = await api.gas["audit-log"].export.get({
          query: queryParams,
        });

        if (response.data instanceof Blob) {
          const url = URL.createObjectURL(response.data);
          const link = document.createElement("a");
          link.href = url;
          link.download = `audit-log-${new Date().toISOString().split("T")[0]}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        let content: string;
        let mimeType: string;
        let extension: string;

        if (format === "csv") {
          content = convertToCSV(logs);
          mimeType = "text/csv;charset=utf-8;";
          extension = "csv";
        } else {
          content = convertToJSON(logs);
          mimeType = "application/json;charset=utf-8;";
          extension = "json";
        }

        // Create download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `audit-log-${new Date().toISOString().split("T")[0]}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setOpen(null);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDescriptions: Record<string, string> = {
    xlsx: "O arquivo Excel é ideal para análise em planilhas com formatação profissional.",
    csv: "O arquivo CSV pode ser aberto no Excel, Google Sheets ou qualquer editor de planilhas.",
    json: "O arquivo JSON contém todos os dados estruturados, ideal para integração com outros sistemas.",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setOpen(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Histórico de Auditoria</DialogTitle>
          <DialogDescription>
            Exporte {logs.length} registro(s) de auditoria para análise externa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="format">Formato de exportação</Label>
            <Select
              value={format}
              onValueChange={(value) =>
                setFormat(value as "xlsx" | "csv" | "json")
              }
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                {exportFormats.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted rounded-md p-3 text-sm">
            <p className="text-muted-foreground">
              {formatDescriptions[format]}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(null)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
