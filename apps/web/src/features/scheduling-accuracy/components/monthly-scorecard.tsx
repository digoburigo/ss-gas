import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle,
  Percent,
  Target,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Skeleton } from "@acme/ui/skeleton";

import { api } from "~/clients/api-client";
import { ContractSelector } from "~/components/gas/contract-selector";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function generateMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const value = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[month]} ${year}`;
    options.push({ value, label });
  }

  return options;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type ThresholdLevel = "green" | "yellow" | "red";

function getAssertivenesLevel(rate: number): ThresholdLevel {
  if (rate >= 90) return "green";
  if (rate >= 70) return "yellow";
  return "red";
}

function getAccuracyLevel(rate: number): ThresholdLevel {
  if (rate >= 95) return "green";
  if (rate >= 85) return "yellow";
  return "red";
}

function getPenaltyLevel(total: number): ThresholdLevel {
  if (total === 0) return "green";
  if (total <= 5000) return "yellow";
  return "red";
}

const levelColors: Record<
  ThresholdLevel,
  { border: string; text: string; bg: string; icon: string }
> = {
  green: {
    border: "border-l-green-500",
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: "text-green-500",
  },
  yellow: {
    border: "border-l-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    icon: "text-yellow-500",
  },
  red: {
    border: "border-l-red-500",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: "text-red-500",
  },
};

const levelLabels: Record<ThresholdLevel, string> = {
  green: "Ótimo",
  yellow: "Atenção",
  red: "Crítico",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function MonthlyScorecard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState("");

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "monthly-scorecard",
      selectedMonth,
      selectedUnitId,
      selectedContractId,
    ],
    queryFn: async () => {
      const response = await api.gas["monthly-scorecard"].get({
        query: {
          month: selectedMonth,
          ...(selectedUnitId ? { unitId: selectedUnitId } : {}),
          ...(selectedContractId ? { contractId: selectedContractId } : {}),
        },
      });
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(errorObj.error ?? "Falha ao carregar placar mensal");
      }
      return response.data;
    },
  });

  const scorecard = data?.scorecard;
  const units = data?.units ?? [];
  const contract = data?.contract;
  const contracts = data?.contracts ?? [];

  const assertivenessLevel = scorecard
    ? getAssertivenesLevel(scorecard.assertivenessRate)
    : "green";
  const accuracyLevel = scorecard
    ? getAccuracyLevel(scorecard.averageAccuracyRate)
    : "green";
  const penaltyLevel = scorecard
    ? getPenaltyLevel(scorecard.penalties.total)
    : "green";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <Label htmlFor="scorecard-month">Mês/Ano</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="scorecard-month" className="w-[200px]">
              <CalendarDays className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="scorecard-unit">Unidade</Label>
          <Select
            value={selectedUnitId ?? "all"}
            onValueChange={(v) => setSelectedUnitId(v === "all" ? null : v)}
          >
            <SelectTrigger id="scorecard-unit" className="w-[200px]">
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {contracts.length > 1 ? (
          <ContractSelector
            contracts={contracts}
            value={selectedContractId || (contract?.id ?? "")}
            onChange={setSelectedContractId}
            label="Contrato"
            className="grid gap-2"
          />
        ) : contract ? (
          <div className="grid gap-2">
            <Label>Contrato</Label>
            <div className="bg-muted flex h-9 items-center rounded-md px-3 text-sm">
              {contract.name} (QDC:{" "}
              {contract.qdcContracted.toLocaleString("pt-BR")} m³/dia)
            </div>
          </div>
        ) : null}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Scorecard Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Assertiveness Rate Card */}
        <Card
          className={`border-l-4 ${isLoading ? "" : levelColors[assertivenessLevel].border}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Assertividade
            </CardTitle>
            {isLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : (
              <Target
                className={`h-4 w-4 ${levelColors[assertivenessLevel].icon}`}
              />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="mb-2 h-8 w-24" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : scorecard ? (
              <>
                <div
                  className={`text-2xl font-bold ${levelColors[assertivenessLevel].text}`}
                >
                  {scorecard.assertivenessRate.toFixed(1)}%
                </div>
                <p className="text-muted-foreground text-xs">
                  {scorecard.daysWithinTolerance} de {scorecard.daysWithData}{" "}
                  dias dentro da tolerância
                </p>
                <div
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[assertivenessLevel].bg} ${levelColors[assertivenessLevel].text}`}
                >
                  {assertivenessLevel === "green" && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {assertivenessLevel === "yellow" && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {assertivenessLevel === "red" && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {levelLabels[assertivenessLevel]}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Average Accuracy Card */}
        <Card
          className={`border-l-4 ${isLoading ? "" : levelColors[accuracyLevel].border}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Acurácia Média
            </CardTitle>
            {isLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : (
              <Percent
                className={`h-4 w-4 ${levelColors[accuracyLevel].icon}`}
              />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="mb-2 h-8 w-24" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : scorecard ? (
              <>
                <div
                  className={`text-2xl font-bold ${levelColors[accuracyLevel].text}`}
                >
                  {scorecard.averageAccuracyRate.toFixed(1)}%
                </div>
                <p className="text-muted-foreground text-xs">
                  Média de QDR/QDP × 100 nos {scorecard.daysWithData} dias com
                  dados
                </p>
                <div
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[accuracyLevel].bg} ${levelColors[accuracyLevel].text}`}
                >
                  {accuracyLevel === "green" && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {accuracyLevel === "yellow" && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {accuracyLevel === "red" && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {levelLabels[accuracyLevel]}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Accumulated Penalties Card */}
        <Card
          className={`border-l-4 ${isLoading ? "" : levelColors[penaltyLevel].border}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Penalidade Acumulada
            </CardTitle>
            {isLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : (
              <BadgeDollarSign
                className={`h-4 w-4 ${levelColors[penaltyLevel].icon}`}
              />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="mb-2 h-8 w-32" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : scorecard ? (
              <>
                <div
                  className={`text-2xl font-bold ${levelColors[penaltyLevel].text}`}
                >
                  {formatCurrency(scorecard.penalties.total)}
                </div>
                <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                  <p>PVEMA: {formatCurrency(scorecard.penalties.pvema)}</p>
                  <p>PVEME: {formatCurrency(scorecard.penalties.pveme)}</p>
                  <p>
                    Sobredemanda:{" "}
                    {formatCurrency(scorecard.penalties.sobredemanda)}
                  </p>
                </div>
                <div
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[penaltyLevel].bg} ${levelColors[penaltyLevel].text}`}
                >
                  {penaltyLevel === "green" && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {penaltyLevel === "yellow" && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {penaltyLevel === "red" && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {levelLabels[penaltyLevel]}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tolerance Info */}
      {contract && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Referência de Tolerância do Contrato
            </CardTitle>
            <CardDescription>
              Faixas de tolerância utilizadas para o cálculo de assertividade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">
                  Tolerância Superior:
                </span>{" "}
                <span className="font-medium">
                  +{contract.transportToleranceUpperPercent}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Tolerância Inferior:
                </span>{" "}
                <span className="font-medium">
                  -{contract.transportToleranceLowerPercent}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">QDC Contratada:</span>{" "}
                <span className="font-medium">
                  {contract.qdcContracted.toLocaleString("pt-BR")} m³/dia
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">
            Ótimo — Assertividade ≥90%, Acurácia ≥95%, Penalidade = R$0
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">
            Atenção — Assertividade ≥70%, Acurácia ≥85%, Penalidade ≤ R$5.000
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">
            Crítico — Abaixo dos limites
          </span>
        </div>
      </div>
    </div>
  );
}
