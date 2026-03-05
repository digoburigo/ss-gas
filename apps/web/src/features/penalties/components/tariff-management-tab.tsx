import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
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
import { Textarea } from "@acme/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";

import { api } from "~/clients/api-client";

type TariffEntry = {
  id: string;
  contractId: string;
  tariffPerUnit: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  tusdTariff: number | null;
  transportCost: number | null;
  notes: string | null;
  status: "pending" | "approved" | "active" | "rejected";
  approvedAt: string | null;
  createdAt: string;
  contract: { id: string; name: string; contractNumber: string | null };
  createdByUser: { id: string; name: string } | null;
  approvedByUser: { id: string; name: string } | null;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR");
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendente",
    variant: "outline" as const,
    className: "border-amber-500 text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  approved: {
    label: "Aprovada",
    variant: "outline" as const,
    className: "border-blue-500 text-blue-600 dark:text-blue-400",
    icon: ShieldCheck,
  },
  active: {
    label: "Ativa",
    variant: "outline" as const,
    className: "border-green-500 text-green-600 dark:text-green-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejeitada",
    variant: "outline" as const,
    className: "border-red-500 text-red-600 dark:text-red-400",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className={`text-xs ${config.className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

interface TariffManagementTabProps {
  contractId: string;
  contracts: Array<{ id: string; name: string; qdcContracted: number }>;
}

export function TariffManagementTab({
  contractId,
  contracts,
}: TariffManagementTabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const effectiveContractId = contractId || contracts[0]?.id || "";

  const { data, isLoading } = useQuery({
    queryKey: ["tariff-history", effectiveContractId],
    queryFn: async () => {
      const response = await api.gas["tariff-history"].get({
        query: { contractId: effectiveContractId },
      });
      if (response.error) {
        throw new Error("Erro ao carregar historico de tarifas");
      }
      return response.data;
    },
    enabled: !!effectiveContractId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: activeData } = useQuery({
    queryKey: ["tariff-active", effectiveContractId],
    queryFn: async () => {
      const response = await api.gas["tariff-history"].active({
        contractId: effectiveContractId,
      }).get();
      if (response.error) return { tariff: null };
      return response.data;
    },
    enabled: !!effectiveContractId,
    staleTime: 2 * 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: async (tariffId: string) => {
      const response = await api.gas["tariff-history"]({ id: tariffId }).approve.post();
      if (response.error) {
        throw new Error(
          typeof response.error === "object" && "error" in response.error
            ? (response.error as { error: string }).error
            : "Erro ao aprovar tarifa",
        );
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Tarifa aprovada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["tariff-history"] });
      queryClient.invalidateQueries({ queryKey: ["tariff-active"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const tariffs = (data?.tariffs ?? []) as unknown as TariffEntry[];
  const activeTariff = activeData?.tariff as unknown as TariffEntry | null | undefined;

  return (
    <div className="space-y-4">
      {/* Active tariff card */}
      <ActiveTariffCard tariff={activeTariff} isLoading={isLoading} />

      {/* History table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historico de Tarifas</CardTitle>
            <CardDescription>
              Todas as alteracoes de tarifa com status de aprovacao
            </CardDescription>
          </div>
          <Button onClick={() => setDrawerOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarifa
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tariffs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">
                Nenhuma tarifa cadastrada para este contrato.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Tarifa (R$/m3)
                    </TableHead>
                    <TableHead className="text-right">TUSD</TableHead>
                    <TableHead className="text-right">Transporte</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead>Aprovado por</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tariffs.map((tariff) => (
                    <TableRow
                      key={tariff.id}
                      className={
                        tariff.status === "active"
                          ? "bg-green-50/50 dark:bg-green-950/10"
                          : tariff.status === "pending"
                            ? "bg-amber-50/50 dark:bg-amber-950/10"
                            : ""
                      }
                    >
                      <TableCell>
                        <StatusBadge status={tariff.status} />
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono truncate">
                        {formatCurrency(tariff.tariffPerUnit)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono truncate">
                        {tariff.tusdTariff != null
                          ? formatCurrency(tariff.tusdTariff)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono truncate">
                        {tariff.transportCost != null
                          ? formatCurrency(tariff.transportCost)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(tariff.effectiveFrom)}
                        {tariff.effectiveTo
                          ? ` - ${formatDate(tariff.effectiveTo)}`
                          : " - Atual"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              {tariff.createdByUser?.name ?? "—"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Criado em {formatDateTime(tariff.createdAt)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-sm">
                        {tariff.approvedByUser ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default">
                                {tariff.approvedByUser.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Aprovado em{" "}
                              {tariff.approvedAt
                                ? formatDateTime(tariff.approvedAt)
                                : "—"}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {tariff.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {tariff.status === "pending" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => approveMutation.mutate(tariff.id)}
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Aprovar tarifa</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create tariff drawer */}
      <CreateTariffDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        contractId={effectiveContractId}
        contracts={contracts}
      />
    </div>
  );
}

function ActiveTariffCard({
  tariff,
  isLoading,
}: {
  tariff: TariffEntry | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-green-500/30">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!tariff) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            Nenhuma tarifa ativa para este contrato.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <CardTitle className="text-base">Tarifa Ativa</CardTitle>
        </div>
        <StatusBadge status="active" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Valor por unidade</p>
            <p className="text-xl font-bold font-mono truncate">
              {formatCurrency(tariff.tariffPerUnit)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">TUSD</p>
            <p className="text-lg font-bold font-mono truncate">
              {tariff.tusdTariff != null
                ? formatCurrency(tariff.tusdTariff)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Custo de transporte</p>
            <p className="text-lg font-bold font-mono truncate">
              {tariff.transportCost != null
                ? formatCurrency(tariff.transportCost)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Vigencia</p>
            <p className="text-sm font-medium">
              {formatDate(tariff.effectiveFrom)}
              {tariff.effectiveTo
                ? ` - ${formatDate(tariff.effectiveTo)}`
                : " - Indefinida"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTariffDrawer({
  open,
  onOpenChange,
  contractId,
  contracts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contracts: Array<{ id: string; name: string; qdcContracted: number }>;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    contractId: contractId,
    tariffPerUnit: "",
    effectiveFrom: "",
    effectiveTo: "",
    tusdTariff: "",
    transportCost: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.gas["tariff-history"].post({
        contractId: data.contractId,
        tariffPerUnit: Number.parseFloat(data.tariffPerUnit),
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || undefined,
        tusdTariff: data.tusdTariff
          ? Number.parseFloat(data.tusdTariff)
          : undefined,
        transportCost: data.transportCost
          ? Number.parseFloat(data.transportCost)
          : undefined,
        notes: data.notes || undefined,
      });
      if (response.error) {
        throw new Error(
          typeof response.error === "object" && "error" in response.error
            ? (response.error as { error: string }).error
            : "Erro ao criar tarifa",
        );
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success("Tarifa criada com status pendente");
      queryClient.invalidateQueries({ queryKey: ["tariff-history"] });
      onOpenChange(false);
      setFormData({
        contractId,
        tariffPerUnit: "",
        effectiveFrom: "",
        effectiveTo: "",
        tusdTariff: "",
        transportCost: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tariffPerUnit || !formData.effectiveFrom) {
      toast.error("Preencha os campos obrigatorios");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Tarifa</SheetTitle>
          <SheetDescription>
            Crie uma nova tarifa. Ela sera criada com status pendente ate ser
            aprovada.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {contracts.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="tariff-contract">Contrato</Label>
              <select
                id="tariff-contract"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.contractId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contractId: e.target.value,
                  }))
                }
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tariff-value">
              Tarifa por unidade (R$/m3) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tariff-value"
              type="number"
              step="0.0001"
              placeholder="0.0000"
              value={formData.tariffPerUnit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tariffPerUnit: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tariff-from">
                Inicio vigencia <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tariff-from"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    effectiveFrom: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tariff-to">Fim vigencia</Label>
              <Input
                id="tariff-to"
                type="date"
                value={formData.effectiveTo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    effectiveTo: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tariff-tusd">TUSD (R$/m3)</Label>
              <Input
                id="tariff-tusd"
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={formData.tusdTariff}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tusdTariff: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tariff-transport">Transporte (R$/m3)</Label>
              <Input
                id="tariff-transport"
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={formData.transportCost}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transportCost: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tariff-notes">Observacoes</Label>
            <Textarea
              id="tariff-notes"
              placeholder="Motivo da alteracao, indice de reajuste, etc."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Criar Tarifa
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
