import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartConfig } from "@acme/ui/chart";
import { Badge } from "@acme/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@acme/ui/breadcrumb";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@acme/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { api } from "~/clients/api-client";
import { ConfigDrawer } from "~/components/config-drawer";
import { ContractSelector } from "~/components/gas/contract-selector";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

export const Route = createFileRoute("/_authenticated/gas/reports")({
  component: GasReportsPage,
});

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

const MONTH_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
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

function getMonthNAgo(n: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - n, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("pt-BR");
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function formatMonthLabel(monthStr: string): string {
  const parts = monthStr.split("-").map(Number);
  const monthIdx = (parts[1] ?? 1) - 1;
  return `${MONTH_SHORT[monthIdx]} ${parts[0]}`;
}

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  atomizer: "Atomizador",
  line: "Linha de Produção",
  dryer: "Secador",
  other: "Outros",
};

const EQUIPMENT_TYPE_COLORS: Record<string, string> = {
  atomizer: "hsl(271, 81%, 56%)",
  line: "hsl(142, 71%, 45%)",
  dryer: "hsl(38, 92%, 50%)",
  other: "hsl(221, 83%, 53%)",
};

// ===== Chart Configs =====

const consumptionChartConfig = {
  qds: { label: "QDS (Suprido)", color: "hsl(271, 81%, 56%)" },
  qdr: { label: "QDR (Realizado)", color: "hsl(38, 92%, 50%)" },
  qdp: { label: "QDP (Programado)", color: "hsl(142, 71%, 45%)" },
} satisfies ChartConfig;

const statusChartConfig = {
  ok: { label: "OK", color: "hsl(142, 71%, 45%)" },
  nok: { label: "NOK", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig;

const comparisonChartConfig = {
  qdp: { label: "QDP (Programado)", color: "hsl(271, 81%, 56%)" },
  qdr: { label: "QDR (Realizado)", color: "hsl(142, 71%, 45%)" },
} satisfies ChartConfig;

const penaltyChartConfig = {
  pvema: { label: "PVEMA", color: "hsl(0, 84%, 60%)" },
  pveme: { label: "PVEME", color: "hsl(38, 92%, 50%)" },
  sobredemanda: { label: "Sobredemanda", color: "hsl(271, 81%, 56%)" },
  total: { label: "Total", color: "hsl(221, 83%, 53%)" },
} satisfies ChartConfig;

const assertivenessChartConfig = {
  assertivenessRate: {
    label: "Assertividade (%)",
    color: "hsl(142, 71%, 45%)",
  },
  averageAccuracyRate: {
    label: "Acurácia Média (%)",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig;

const UNIT_ALL = "__all__";

type DateRangePreset = "monthly" | "quarterly" | "yearly";

function ComparisonTooltip({
  active,
  payload,
  toleranceUpper,
  toleranceLower,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: {
      qdp: number;
      qdr: number;
      fullDate: string;
      deviationPercent: number;
      exceedsTolerance: boolean;
      upperLimit: number;
      lowerLimit: number;
    };
  }>;
  label?: string;
  toleranceUpper: number;
  toleranceLower: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;

  return (
    <div className="bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="mb-1 text-sm font-medium">{entry.fullDate}</p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: "hsl(271, 81%, 56%)" }}>
            QDP (Programado)
          </span>
          <span className="font-medium">{formatValue(entry.qdp)} m³</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span
            style={{
              color: entry.exceedsTolerance
                ? "hsl(0, 84%, 60%)"
                : "hsl(142, 71%, 45%)",
            }}
          >
            QDR (Realizado)
          </span>
          <span className="font-medium">{formatValue(entry.qdr)} m³</span>
        </div>
        {entry.qdp > 0 && (
          <>
            <hr className="border-border my-1" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Desvio</span>
              <span
                className={`font-medium ${
                  entry.exceedsTolerance
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {entry.deviationPercent >= 0 ? "+" : ""}
                {entry.deviationPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Tolerância</span>
              <span className="text-muted-foreground">
                +{toleranceUpper}% / −{toleranceLower}%
              </span>
            </div>
            {entry.exceedsTolerance && (
              <div className="mt-1 rounded bg-red-100 px-1.5 py-0.5 text-center text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Fora da tolerância
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ===== Dashboard Tab =====

function DashboardTab() {
  const [dateRange, setDateRange] = useState<DateRangePreset>("quarterly");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(UNIT_ALL);
  const [isDownloading, setIsDownloading] = useState(false);

  const { startMonth, endMonth } = useMemo(() => {
    const end = getCurrentMonth();
    let start: string;
    switch (dateRange) {
      case "monthly":
        start = end;
        break;
      case "quarterly":
        start = getMonthNAgo(2);
        break;
      case "yearly":
        start = getMonthNAgo(11);
        break;
    }
    return { startMonth: start, endMonth: end };
  }, [dateRange]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "gas",
      "reports",
      "dashboard",
      startMonth,
      endMonth,
      selectedContractId,
      selectedUnit === UNIT_ALL ? "" : selectedUnit,
    ],
    queryFn: async () => {
      const response = await api.gas.reports.dashboard.get({
        query: {
          startMonth,
          endMonth,
          ...(selectedContractId ? { contractId: selectedContractId } : {}),
          ...(selectedUnit !== UNIT_ALL ? { unitId: selectedUnit } : {}),
        },
      });
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(
          errorObj.error ?? "Falha ao carregar dados do dashboard",
        );
      }
      return response.data;
    },
  });

  // Build unit-grouped bar chart data (Chart 1)
  const consumptionChartData = useMemo(() => {
    if (!data?.consumptionByUnit) return [];
    // Flatten: one entry per month per unit
    const result: Array<{
      month: string;
      label: string;
      qdp: number;
      qdr: number;
      unitName: string;
    }> = [];
    for (const monthData of data.consumptionByUnit) {
      for (const unit of monthData.units) {
        result.push({
          month: monthData.month,
          label: `${formatMonthLabel(monthData.month)} - ${unit.unitCode}`,
          qdp: unit.qdp,
          qdr: unit.qdr,
          unitName: unit.unitName,
        });
      }
    }
    return result;
  }, [data]);

  // Penalty line chart data (Chart 2)
  const penaltyChartData = useMemo(() => {
    if (!data?.penaltiesByMonth) return [];
    return data.penaltiesByMonth.map((p) => ({
      ...p,
      label: formatMonthLabel(p.month),
    }));
  }, [data]);

  // Assertiveness trend data (Chart 3)
  const assertivenessData = useMemo(() => {
    if (!data?.assertivenessTrend) return [];
    return data.assertivenessTrend.map((a) => ({
      ...a,
      label: formatMonthLabel(a.month),
    }));
  }, [data]);

  // Unit comparison data (Chart 4)
  const unitComparisonData = useMemo(() => {
    if (!data?.unitComparison) return [];
    return data.unitComparison.map((u) => ({
      ...u,
      label: u.unitCode || u.unitName,
    }));
  }, [data]);

  // Equipment type distribution (Chart 5)
  const equipmentDistData = useMemo(() => {
    if (!data?.equipmentTypeDistribution) return [];
    return data.equipmentTypeDistribution.map((e) => ({
      name: EQUIPMENT_TYPE_LABELS[e.type] ?? e.type,
      value: e.totalConsumption,
      fill: EQUIPMENT_TYPE_COLORS[e.type] ?? "hsl(200, 60%, 50%)",
    }));
  }, [data]);

  const equipmentDistConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    for (const item of equipmentDistData) {
      config[item.name] = { label: item.name, color: item.fill };
    }
    return config satisfies ChartConfig;
  }, [equipmentDistData]);

  const totalEquipmentConsumption = useMemo(
    () => equipmentDistData.reduce((sum, item) => sum + item.value, 0),
    [equipmentDistData],
  );

  const handleDownloadDashboard = async () => {
    setIsDownloading(true);
    try {
      const response = await api.gas.reports.dashboard.download.get({
        query: {
          startMonth,
          endMonth,
          ...(selectedContractId ? { contractId: selectedContractId } : {}),
        },
      });
      if (response.error) {
        throw new Error("Falha ao gerar arquivo");
      }
      const blob = response.data as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dashboard_${startMonth}_${endMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Download failed silently
    } finally {
      setIsDownloading(false);
    }
  };

  const unitComparisonChartConfig = {
    assertivenessRate: {
      label: "Assertividade (%)",
      color: "hsl(142, 71%, 45%)",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Período:</span>
              <Select
                value={dateRange}
                onValueChange={(v) => setDateRange(v as DateRangePreset)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data?.units && data.units.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Unidade:</span>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNIT_ALL}>
                      Todas as Unidades
                    </SelectItem>
                    {data.units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.code} - {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {data?.contracts && data.contracts.length > 1 && (
              <ContractSelector
                contracts={data.contracts}
                value={selectedContractId || data.contract.id}
                onChange={setSelectedContractId}
                label="Contrato"
                className="min-w-[200px]"
              />
            )}

            <div className="ml-auto">
              <Button
                variant="outline"
                onClick={handleDownloadDashboard}
                disabled={isLoading || isDownloading || !data}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Chart 1: Consumo mensal Planejado vs Realizado por unidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Consumo Mensal: Planejado vs Realizado por Unidade
              </CardTitle>
              <CardDescription>
                Comparativo de QDP (Programado) e QDR (Realizado) agrupado por
                unidade ao longo dos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consumptionChartData.length > 0 ? (
                <ChartContainer
                  config={comparisonChartConfig}
                  className="h-[400px] w-full"
                >
                  <BarChart
                    data={consumptionChartData}
                    margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `${(value / 1000).toLocaleString("pt-BR")}k`
                      }
                    />
                    <ChartTooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => String(value)}
                          indicator="line"
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="qdp"
                      fill="var(--color-qdp)"
                      opacity={0.7}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="qdr"
                      fill="var(--color-qdr)"
                      opacity={0.8}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChart />
              )}
            </CardContent>
          </Card>

          {/* Chart 2 & 3: Penalties + Assertiveness side by side */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Chart 2: Penalidades acumuladas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Penalidades Acumuladas
                </CardTitle>
                <CardDescription>
                  Evolução mensal de PVEMA, PVEME e Sobredemanda (R$)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {penaltyChartData.length > 0 ? (
                  <ChartContainer
                    config={penaltyChartConfig}
                    className="h-[300px] w-full"
                  >
                    <LineChart
                      data={penaltyChartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => String(value)}
                            formatter={(value) =>
                              formatCurrency(value as number)
                            }
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        dataKey="pvema"
                        type="monotone"
                        stroke="var(--color-pvema)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        dataKey="pveme"
                        type="monotone"
                        stroke="var(--color-pveme)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        dataKey="sobredemanda"
                        type="monotone"
                        stroke="var(--color-sobredemanda)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        dataKey="total"
                        type="monotone"
                        stroke="var(--color-total)"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <EmptyChart />
                )}
              </CardContent>
            </Card>

            {/* Chart 3: Taxa de assertividade histórica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Taxa de Assertividade Histórica
                </CardTitle>
                <CardDescription>
                  Evolução mensal da assertividade e acurácia média (%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assertivenessData.length > 0 ? (
                  <ChartContainer
                    config={assertivenessChartConfig}
                    className="h-[300px] w-full"
                  >
                    <LineChart
                      data={assertivenessData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <ChartTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => String(value)}
                            formatter={(value) => `${(value as number).toFixed(1)}%`}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        dataKey="assertivenessRate"
                        type="monotone"
                        stroke="var(--color-assertivenessRate)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        dataKey="averageAccuracyRate"
                        type="monotone"
                        stroke="var(--color-averageAccuracyRate)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <EmptyChart />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart 4 & 5: Unit Comparison + Equipment Distribution */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Chart 4: Comparativo entre unidades */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Comparativo entre Unidades
                </CardTitle>
                <CardDescription>
                  Ranking de unidades por taxa de assertividade (%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unitComparisonData.length > 0 ? (
                  <ChartContainer
                    config={unitComparisonChartConfig}
                    className="h-[300px] w-full"
                  >
                    <BarChart
                      data={unitComparisonData}
                      layout="vertical"
                      margin={{ top: 10, right: 20, bottom: 10, left: 80 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                        width={70}
                      />
                      <ChartTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => String(value)}
                            formatter={(value) => `${(value as number).toFixed(1)}%`}
                          />
                        }
                      />
                      <Bar
                        dataKey="assertivenessRate"
                        fill="var(--color-assertivenessRate)"
                        radius={[0, 4, 4, 0]}
                      >
                        {unitComparisonData.map((entry) => (
                          <Cell
                            key={entry.unitId}
                            fill={
                              entry.assertivenessRate >= 80
                                ? "hsl(142, 71%, 45%)"
                                : entry.assertivenessRate >= 60
                                  ? "hsl(38, 92%, 50%)"
                                  : "hsl(0, 84%, 60%)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <EmptyChart />
                )}
              </CardContent>
            </Card>

            {/* Chart 5: Distribuição de consumo por tipo de equipamento */}
            <Card>
              <CardHeader>
                <CardTitle>Consumo por Tipo de Equipamento</CardTitle>
                <CardDescription>
                  Distribuição do consumo total (m³)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {equipmentDistData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ChartContainer
                      config={equipmentDistConfig}
                      className="h-[200px] w-full"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(value) => String(value)}
                              formatter={(value) =>
                                `${formatValue(value as number)} m³`
                              }
                            />
                          }
                        />
                        <Pie
                          data={equipmentDistData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {equipmentDistData.map((entry) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={entry.fill}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="mt-4 grid w-full gap-2">
                      {equipmentDistData.map((item) => {
                        const percent =
                          totalEquipmentConsumption > 0
                            ? (
                                (item.value / totalEquipmentConsumption) *
                                100
                              ).toFixed(1)
                            : "0";
                        return (
                          <div
                            key={item.name}
                            className="hover:bg-muted/50 flex items-center justify-between rounded-md p-2"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: item.fill }}
                              />
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {formatValue(item.value)} m³ ({percent}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyChart height="h-[200px]" />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyChart({ height = "h-[300px]" }: { height?: string }) {
  return (
    <div className={`flex ${height} items-center justify-center`}>
      <p className="text-muted-foreground text-sm">
        Nenhum dado disponível para o período selecionado.
      </p>
    </div>
  );
}

// ===== Petrobras Report Tab =====

function PetrobrasReportTab() {
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [comparisonMonth, setComparisonMonth] = useState(getCurrentMonth());
  const [selectedUnit, setSelectedUnit] = useState(UNIT_ALL);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "gas",
      "reports",
      "petrobras",
      selectedMonth,
      selectedContractId,
    ],
    queryFn: async () => {
      const response = await api.gas.reports.petrobras.get({
        query: {
          month: selectedMonth,
          ...(selectedContractId ? { contractId: selectedContractId } : {}),
        },
      });
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(
          errorObj.error ?? "Falha ao carregar dados do relatório",
        );
      }
      return response.data;
    },
  });

  const { data: consolidatedData, isLoading: isLoadingComparison } = useQuery({
    queryKey: ["gas", "consolidated", comparisonMonth, selectedContractId],
    queryFn: async () => {
      const response = await api.gas.consolidated.get({
        query: {
          month: comparisonMonth,
          ...(selectedContractId ? { contractId: selectedContractId } : {}),
        },
      });
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(
          errorObj.error ?? "Falha ao carregar dados consolidados",
        );
      }
      return response.data;
    },
  });

  const unitOptions = useMemo(() => {
    if (!consolidatedData?.units) return [];
    return consolidatedData.units;
  }, [consolidatedData]);

  const toleranceBands = useMemo(() => {
    if (!consolidatedData?.contract) return null;
    const { transportToleranceUpperPercent, transportToleranceLowerPercent } =
      consolidatedData.contract;
    return {
      upperPercent: transportToleranceUpperPercent,
      lowerPercent: transportToleranceLowerPercent,
    };
  }, [consolidatedData]);

  const comparisonChartData = useMemo(() => {
    if (!consolidatedData?.dailySummaries) return [];
    return consolidatedData.dailySummaries.map((day) => {
      let qdp: number;
      let qdr: number;
      if (selectedUnit === UNIT_ALL) {
        qdp = day.qdpTotal;
        qdr = day.qdrTotal;
      } else {
        const unitData = day.units.find((u) => u.unitId === selectedUnit);
        qdp = unitData?.qdp ?? 0;
        qdr = unitData?.qdr ?? 0;
      }
      const upperLimit =
        qdp > 0 ? qdp * (1 + (toleranceBands?.upperPercent ?? 10) / 100) : 0;
      const lowerLimit =
        qdp > 0 ? qdp * (1 - (toleranceBands?.lowerPercent ?? 20) / 100) : 0;
      const exceedsTolerance =
        qdp > 0 && (qdr > upperLimit || qdr < lowerLimit);
      return {
        date: new Date(day.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        fullDate: new Date(day.date).toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        qdp,
        qdr,
        upperLimit,
        lowerLimit,
        exceedsTolerance,
        deviationPercent: qdp > 0 ? ((qdr - qdp) / qdp) * 100 : 0,
      };
    });
  }, [consolidatedData, selectedUnit, toleranceBands]);

  const chartData = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.map((row) => ({
      date: row.date.toString(),
      displayDate: formatDate(row.date),
      qdc: row.qdcContracted,
      qds: row.qdsTotal,
      qdp: row.qdpTotal,
      qdr: row.qdrTotal,
      transportDeviation: row.transportDeviation,
      moleculeDeviation: row.moleculeDeviation,
      status: row.overallStatus,
    }));
  }, [data]);

  const statusDistribution = useMemo(() => {
    if (!data?.summary) return [];
    return [
      { name: "OK", value: data.summary.daysOk, fill: "hsl(142, 71%, 45%)" },
      {
        name: "NOK",
        value: data.summary.daysNok,
        fill: "hsl(0, 84%, 60%)",
      },
    ];
  }, [data]);

  const totalDays = useMemo(
    () => statusDistribution.reduce((sum, item) => sum + item.value, 0),
    [statusDistribution],
  );

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.gas.reports.petrobras.download.get({
        query: { month: selectedMonth },
      });
      if (response.error) {
        throw new Error("Falha ao gerar arquivo");
      }
      const blob = response.data as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        data?.suggestedFilename ?? `RC_${selectedMonth}_Petrobras.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Download failed silently
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {consolidatedData?.contracts &&
        consolidatedData.contracts.length > 1 && (
          <div className="flex justify-end">
            <ContractSelector
              contracts={consolidatedData.contracts}
              value={selectedContractId || consolidatedData.contract.id}
              onChange={setSelectedContractId}
              label="Contrato"
              className="min-w-[200px]"
            />
          </div>
        )}

      {/* QDP vs QDR Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Planejado vs Realizado
          </CardTitle>
          <CardDescription>
            Comparativo diário de QDP (Programado) e QDR (Realizado) com faixas
            de tolerância CUSD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Mês:</span>
              <Select
                value={comparisonMonth}
                onValueChange={setComparisonMonth}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione o mês" />
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
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Unidade:</span>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNIT_ALL}>Todas as Unidades</SelectItem>
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {toleranceBands && (
              <div className="text-muted-foreground ml-auto text-xs">
                Tolerância: +{toleranceBands.upperPercent}% / −
                {toleranceBands.lowerPercent}%
              </div>
            )}
          </div>

          {isLoadingComparison ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : comparisonChartData.length > 0 ? (
            <ChartContainer
              config={comparisonChartConfig}
              className="h-[400px] w-full"
            >
              <ComposedChart
                data={comparisonChartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    `${(value / 1000).toLocaleString("pt-BR")}k`
                  }
                />
                {comparisonChartData.some((d) => d.qdp > 0) && (
                  <ReferenceArea
                    y1={Math.min(
                      ...comparisonChartData
                        .filter((d) => d.lowerLimit > 0)
                        .map((d) => d.lowerLimit),
                    )}
                    y2={Math.max(
                      ...comparisonChartData
                        .filter((d) => d.upperLimit > 0)
                        .map((d) => d.upperLimit),
                    )}
                    fill="hsl(142, 71%, 45%)"
                    fillOpacity={0.08}
                    stroke="hsl(142, 71%, 45%)"
                    strokeOpacity={0.2}
                    strokeDasharray="4 4"
                  />
                )}
                <ChartTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={
                    <ComparisonTooltip
                      toleranceUpper={toleranceBands?.upperPercent ?? 10}
                      toleranceLower={toleranceBands?.lowerPercent ?? 20}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="qdp"
                  fill="var(--color-qdp)"
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="qdr" radius={[4, 4, 0, 0]}>
                  {comparisonChartData.map((entry) => (
                    <Cell
                      key={`qdr-${entry.date}`}
                      fill={
                        entry.exceedsTolerance
                          ? "hsl(0, 84%, 60%)"
                          : "hsl(142, 71%, 45%)"
                      }
                      opacity={entry.exceedsTolerance ? 0.9 : 0.8}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ChartContainer>
          ) : (
            <EmptyChart height="h-[400px]" />
          )}

          {comparisonChartData.some((d) => d.exceedsTolerance) && (
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-red-500 opacity-90" />
                <span className="text-muted-foreground">
                  QDR fora da tolerância
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-sm opacity-80"
                  style={{ backgroundColor: "hsl(142, 71%, 45%)" }}
                />
                <span className="text-muted-foreground">
                  QDR dentro da tolerância
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm border border-dashed border-green-500/40 bg-green-500/10" />
                <span className="text-muted-foreground">
                  Faixa de tolerância
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Petrobras Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Relatório Petrobras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Mês:</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione o mês" />
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
            <Button
              onClick={handleDownload}
              disabled={isLoading || isDownloading || !data}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Excel
                </>
              )}
            </Button>
          </div>

          {data?.summary && (
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Total de Dias</p>
                <p className="text-xl font-semibold">
                  {data.summary.totalDays}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Dias com Dados</p>
                <p className="text-xl font-semibold">
                  {data.summary.daysWithData}
                </p>
              </div>
              <div className="rounded-lg border border-green-500/30 bg-green-50 p-3 dark:bg-green-900/10">
                <p className="text-muted-foreground text-xs">Dias OK</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {data.summary.daysOk}
                </p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-50 p-3 dark:bg-red-900/10">
                <p className="text-muted-foreground text-xs">Dias NOK</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                  {data.summary.daysNok}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência de Consumo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ChartContainer
                config={consumptionChartConfig}
                className="h-[300px] w-full"
              >
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${(value / 1000).toLocaleString("pt-BR")}k`
                    }
                  />
                  {chartData[0]?.qdc && (
                    <ReferenceLine
                      y={chartData[0].qdc}
                      stroke="hsl(221, 83%, 53%)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.7}
                      label={{
                        value: "QDC",
                        position: "insideTopRight",
                        fill: "hsl(221, 83%, 53%)",
                        fontSize: 11,
                      }}
                    />
                  )}
                  <ChartTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => String(value)}
                        indicator="line"
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="qds"
                    fill="var(--color-qds)"
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="qdr"
                    fill="var(--color-qdr)"
                    opacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    dataKey="qdp"
                    type="monotone"
                    stroke="var(--color-qdp)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-qdp)" }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : statusDistribution.length > 0 && totalDays > 0 ? (
              <div className="flex flex-col items-center">
                <ChartContainer
                  config={statusChartConfig}
                  className="h-[220px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => String(value)}
                        />
                      }
                    />
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusDistribution.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 grid w-full gap-2">
                  {statusDistribution.map((item) => {
                    const percent = (
                      (item.value / totalDays) *
                      100
                    ).toFixed(1);
                    return (
                      <div
                        key={item.name}
                        className="hover:bg-muted/50 flex items-center justify-between rounded-md p-2"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {item.value} dias ({percent}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              <span className="text-muted-foreground ml-2">
                Carregando dados...
              </span>
            </div>
          ) : error ? (
            <div className="text-destructive py-4 text-center">
              Erro ao carregar dados: {error.message}
            </div>
          ) : data?.rows && data.rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dia</TableHead>
                  <TableHead className="text-right">QDC</TableHead>
                  <TableHead className="text-right">QDS Total</TableHead>
                  <TableHead className="text-right">QDP Total</TableHead>
                  <TableHead className="text-right">QDR Total</TableHead>
                  <TableHead className="text-right">Desvio Transp.</TableHead>
                  <TableHead className="text-right">Desvio Mol.</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.date.toString()}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>{row.dayOfWeek}</TableCell>
                    <TableCell className="text-right">
                      {formatValue(row.qdcContracted)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(row.qdsTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(row.qdpTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(row.qdrTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          row.transportStatus !== "within"
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }
                      >
                        {formatValue(row.transportDeviation)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          row.moleculeStatus !== "within"
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }
                      >
                        {formatValue(row.moleculeDeviation)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          row.overallStatus === "ok"
                            ? "success"
                            : "destructive"
                        }
                      >
                        {row.overallStatus === "ok" ? "OK" : "NOK"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground py-4 text-center">
              Nenhum dado encontrado para o mês selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Main Page =====

function GasReportsPage() {
  return (
    <>
      <Header fixed>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/gas">Gas</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Relatórios</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Relatórios de Gás
          </h2>
          <p className="text-muted-foreground">
            Dashboard consolidado e relatórios mensais de consumo de gás.
          </p>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="petrobras" className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              Relatório Petrobras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="petrobras" className="mt-4">
            <PetrobrasReportTab />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
