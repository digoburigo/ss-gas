import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { ScrollArea } from "@acme/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import { api } from "~/clients/api-client";

type MonthlySchedulingUploadDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type InterpretedRow = {
  rowNumber: number;
  date: string;
  unitId: string | null;
  unitName: string;
  matchedUnitName: string | null;
  volume: number;
  notes: string | null;
  errors: string[];
};

type UploadResult = {
  success: boolean;
  columnMapping: Record<string, string | null>;
  rows: InterpretedRow[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    hasErrors: boolean;
  };
};

type ConfirmResult = {
  success: boolean;
  created: number;
  errors: Array<{ rowNumber: number; error: string }>;
  importLog: {
    totalRows: number;
    imported: number;
    errors: number;
    skipped: number;
  };
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
  });
}

export function MonthlySchedulingUploadDrawer({
  open,
  onOpenChange,
}: MonthlySchedulingUploadDrawerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [rowEdits, setRowEdits] = useState<
    Map<number, { volume?: number; notes?: string | null }>
  >(new Map());
  const [importSummary, setImportSummary] = useState<ConfirmResult | null>(
    null,
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      const response = await api.gas["monthly-scheduling"].upload.post({
        fileBase64: base64,
      });

      if (response.error) {
        throw new Error(
          typeof response.error.value === "object" &&
            response.error.value !== null &&
            "error" in response.error.value
            ? (response.error.value as { error: string }).error
            : "Erro ao processar planilha",
        );
      }

      return response.data as UploadResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setExcludedRows(new Set());
      setRowEdits(new Map());
      setEditingRow(null);
      setImportSummary(null);
      if (data.summary.hasErrors) {
        toast.warning(
          `${data.summary.validRows} linhas validas, ${data.summary.errorRows} com erros`,
        );
      } else {
        toast.success(
          `${data.summary.totalRows} linhas interpretadas com sucesso`,
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (rows: InterpretedRow[]) => {
      const validRows = rows
        .filter(
          (r) =>
            r.errors.length === 0 &&
            r.unitId &&
            !excludedRows.has(r.rowNumber),
        )
        .map((r) => {
          const edits = rowEdits.get(r.rowNumber);
          return {
            rowNumber: r.rowNumber,
            date: r.date,
            unitId: r.unitId,
            unitName: r.matchedUnitName ?? r.unitName,
            volume: edits?.volume ?? r.volume,
            notes: edits?.notes !== undefined ? edits.notes : r.notes,
          };
        });

      const totalRows = result?.summary.totalRows ?? 0;
      const skippedCount =
        excludedRows.size +
        (result?.rows.filter((r) => r.errors.length > 0).length ?? 0);

      const response = await api.gas["monthly-scheduling"].confirm.post({
        rows: validRows,
        importLog: {
          totalRows,
          skipped: skippedCount,
        },
      });

      if (response.error) {
        throw new Error(
          typeof response.error.value === "object" &&
            response.error.value !== null &&
            "error" in response.error.value
            ? (response.error.value as { error: string }).error
            : "Erro ao confirmar importacao",
        );
      }

      return response.data as ConfirmResult;
    },
    onSuccess: (data) => {
      setImportSummary(data);
      toast.success(
        `${data.importLog.imported} registros importados com sucesso`,
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file) return;

      const isExcel =
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";

      if (!isExcel) {
        toast.error(
          "Arquivo invalido. Selecione um arquivo Excel (.xlsx ou .xls).",
        );
        return;
      }

      setUploadedFile(file);
      setResult(null);
      setImportSummary(null);
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setUploadedFile(null);
    setResult(null);
    setExcludedRows(new Set());
    setRowEdits(new Map());
    setEditingRow(null);
    setImportSummary(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.gas["monthly-scheduling"].template.get();
      if (response.error) {
        toast.error("Erro ao baixar template");
        return;
      }
      const blob = response.data as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-programacao-mensal.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar template");
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    confirmMutation.mutate(result.rows);
  };

  const toggleRowExclusion = (rowNumber: number) => {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  };

  const startEditing = (rowNumber: number, row: InterpretedRow) => {
    setEditingRow(rowNumber);
    if (!rowEdits.has(rowNumber)) {
      setRowEdits((prev) => {
        const next = new Map(prev);
        next.set(rowNumber, { volume: row.volume, notes: row.notes });
        return next;
      });
    }
  };

  const updateRowEdit = (
    rowNumber: number,
    field: "volume" | "notes",
    value: string,
  ) => {
    setRowEdits((prev) => {
      const next = new Map(prev);
      const current = next.get(rowNumber) ?? {};
      if (field === "volume") {
        const parsed = Number.parseFloat(value.replace(",", "."));
        next.set(rowNumber, {
          ...current,
          volume: Number.isNaN(parsed) ? 0 : parsed,
        });
      } else {
        next.set(rowNumber, { ...current, notes: value || null });
      }
      return next;
    });
  };

  const getRowVolume = (row: InterpretedRow): number => {
    const edits = rowEdits.get(row.rowNumber);
    return edits?.volume ?? row.volume;
  };

  const getRowNotes = (row: InterpretedRow): string | null => {
    const edits = rowEdits.get(row.rowNumber);
    return edits?.notes !== undefined ? edits.notes : row.notes;
  };

  const activeValidRows =
    result?.rows.filter(
      (r) => r.errors.length === 0 && !excludedRows.has(r.rowNumber),
    ) ?? [];
  const errorRows = result?.rows.filter((r) => r.errors.length > 0) ?? [];
  const excludedCount = excludedRows.size;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden p-0 sm:max-w-[800px]">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Upload de Programacao Mensal</SheetTitle>
          <SheetDescription>
            Faca upload de uma planilha Excel para criar programacoes mensais
            automaticamente. A IA interpretara os dados da planilha.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Template download + file actions bar */}
          <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="h-7 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar Template
            </Button>
            {uploadedFile && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  {uploadedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 px-2"
                >
                  <X className="mr-1 h-4 w-4" />
                  Remover
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {importSummary ? (
                // Import summary after confirmation
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-6">
                    <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
                    <h3 className="text-lg font-semibold">
                      Importacao Concluida
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Os registros foram salvos com sucesso.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-md p-4">
                    <p className="mb-3 font-medium">Resumo da Importacao:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between rounded-md border bg-background p-2">
                        <span className="text-muted-foreground">
                          Total de linhas
                        </span>
                        <span className="font-mono font-medium">
                          {importSummary.importLog.totalRows}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border bg-background p-2">
                        <span className="text-muted-foreground">
                          Importados
                        </span>
                        <span className="font-mono font-medium text-green-600">
                          {importSummary.importLog.imported}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border bg-background p-2">
                        <span className="text-muted-foreground">Erros</span>
                        <span
                          className={cn(
                            "font-mono font-medium",
                            importSummary.importLog.errors > 0 &&
                              "text-red-600",
                          )}
                        >
                          {importSummary.importLog.errors}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border bg-background p-2">
                        <span className="text-muted-foreground">
                          Ignorados
                        </span>
                        <span className="text-muted-foreground font-mono font-medium">
                          {importSummary.importLog.skipped}
                        </span>
                      </div>
                    </div>
                  </div>

                  {importSummary.errors.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                      <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
                        Erros ao salvar:
                      </p>
                      <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
                        {importSummary.errors.map((err) => (
                          <li key={err.rowNumber}>
                            <strong>Linha {err.rowNumber}:</strong> {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={() => {
                        handleReset();
                        onOpenChange(false);
                      }}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              ) : !uploadedFile ? (
                // Upload area
                <div
                  className="flex flex-col items-center justify-center p-8"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="border-input hover:border-primary/50 hover:bg-accent/50 flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      id="monthly-scheduling-upload"
                    />
                    <label
                      htmlFor="monthly-scheduling-upload"
                      className="flex cursor-pointer flex-col items-center"
                    >
                      <Upload className="text-muted-foreground mb-4 h-12 w-12" />
                      <p className="mb-2 text-center font-medium">
                        Arraste e solte a planilha aqui
                      </p>
                      <p className="text-muted-foreground text-center text-sm">
                        ou clique para selecionar
                      </p>
                      <p className="text-muted-foreground mt-2 text-center text-xs">
                        Formatos aceitos: .xlsx, .xls
                      </p>
                    </label>
                  </div>
                </div>
              ) : uploadMutation.isPending ? (
                // Loading state
                <div className="flex h-64 flex-col items-center justify-center">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                  <p className="text-muted-foreground">
                    Interpretando planilha com IA...
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Isso pode levar alguns segundos
                  </p>
                </div>
              ) : uploadMutation.isError ? (
                // Error state
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
                  <p className="font-medium text-red-600">
                    Erro ao processar planilha
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {uploadMutation.error.message}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleReset}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : result ? (
                // Results table
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-3">
                    <Label className="font-medium">Resultado:</Label>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {activeValidRows.length} validas
                    </Badge>
                    {errorRows.length > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {errorRows.length} com erros
                      </Badge>
                    )}
                    {excludedCount > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <X className="h-3 w-3" />
                        {excludedCount} excluidas
                      </Badge>
                    )}
                  </div>

                  {/* Column mapping info */}
                  {result.columnMapping && (
                    <div className="bg-muted/50 rounded-md p-3 text-sm">
                      <p className="mb-1 font-medium">
                        Mapeamento de colunas detectado:
                      </p>
                      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        {result.columnMapping.date && (
                          <span>
                            Data: <strong>{result.columnMapping.date}</strong>
                          </span>
                        )}
                        {result.columnMapping.unit && (
                          <span>
                            Unidade:{" "}
                            <strong>{result.columnMapping.unit}</strong>
                          </span>
                        )}
                        {result.columnMapping.volume && (
                          <span>
                            Volume:{" "}
                            <strong>{result.columnMapping.volume}</strong>
                          </span>
                        )}
                        {result.columnMapping.notes && (
                          <span>
                            Obs: <strong>{result.columnMapping.notes}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Data table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10" />
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead className="text-right">
                            Volume (m3)
                          </TableHead>
                          <TableHead>Obs</TableHead>
                          <TableHead className="w-16 text-center">
                            Status
                          </TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.rows.map((row) => {
                          const hasErrors = row.errors.length > 0;
                          const isExcluded = excludedRows.has(row.rowNumber);
                          const isEditing = editingRow === row.rowNumber;
                          const volume = getRowVolume(row);
                          const notes = getRowNotes(row);

                          return (
                            <TableRow
                              key={row.rowNumber}
                              className={cn(
                                hasErrors && "bg-red-50 dark:bg-red-950/20",
                                isExcluded && "opacity-40",
                              )}
                            >
                              <TableCell className="px-2">
                                {!hasErrors && (
                                  <Checkbox
                                    checked={!isExcluded}
                                    onCheckedChange={() =>
                                      toggleRowExclusion(row.rowNumber)
                                    }
                                    aria-label={`Incluir linha ${row.rowNumber}`}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {row.rowNumber}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {row.date
                                  ? new Date(row.date).toLocaleDateString(
                                      "pt-BR",
                                    )
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div>
                                  {row.matchedUnitName ?? row.unitName}
                                </div>
                                {row.matchedUnitName &&
                                  row.matchedUnitName !== row.unitName && (
                                    <div className="text-muted-foreground text-xs">
                                      Original: {row.unitName}
                                    </div>
                                  )}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono">
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    className="h-7 w-24 text-right font-mono text-sm"
                                    defaultValue={volume?.toLocaleString(
                                      "pt-BR",
                                      { maximumFractionDigits: 1 },
                                    )}
                                    onChange={(e) =>
                                      updateRowEdit(
                                        row.rowNumber,
                                        "volume",
                                        e.target.value,
                                      )
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        setEditingRow(null);
                                    }}
                                  />
                                ) : (
                                  (volume?.toLocaleString("pt-BR", {
                                    maximumFractionDigits: 1,
                                  }) ?? "-")
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-[150px] text-sm">
                                {isEditing ? (
                                  <Input
                                    type="text"
                                    className="h-7 text-sm"
                                    defaultValue={notes ?? ""}
                                    onChange={(e) =>
                                      updateRowEdit(
                                        row.rowNumber,
                                        "notes",
                                        e.target.value,
                                      )
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        setEditingRow(null);
                                    }}
                                  />
                                ) : (
                                  <span className="truncate">
                                    {notes ?? "-"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {hasErrors ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <XCircle className="mx-auto h-4 w-4 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <ul className="list-disc pl-4 text-xs">
                                        {row.errors.map((err) => (
                                          <li key={err}>{err}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : isExcluded ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Excluida
                                  </Badge>
                                ) : (
                                  <Check className="mx-auto h-4 w-4 text-green-600" />
                                )}
                              </TableCell>
                              <TableCell className="px-2">
                                {!hasErrors && !isExcluded && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                          if (isEditing) {
                                            setEditingRow(null);
                                          } else {
                                            startEditing(row.rowNumber, row);
                                          }
                                        }}
                                      >
                                        {isEditing ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <Pencil className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {isEditing ? "Salvar" : "Editar"}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Error details */}
                  {errorRows.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                      <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
                        Erros encontrados ({errorRows.length} linhas):
                      </p>
                      <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
                        {errorRows.map((row) => (
                          <li key={row.rowNumber}>
                            <strong>Linha {row.rowNumber}:</strong>{" "}
                            {row.errors.join("; ")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </ScrollArea>

          {/* Footer with confirm button */}
          {result && !importSummary && activeValidRows.length > 0 && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-muted-foreground text-sm">
                {activeValidRows.length} registro(s) serao importados
                {(errorRows.length > 0 || excludedCount > 0) &&
                  ` (${errorRows.length + excludedCount} ignorados)`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirmar Importacao
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
