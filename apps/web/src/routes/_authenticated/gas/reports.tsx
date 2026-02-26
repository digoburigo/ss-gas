import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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

import { api } from "~/clients/api-client";
import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

export const Route = createFileRoute("/_authenticated/gas/reports")({
  component: GasReportsPage,
});

/**
 * Portuguese month names for display
 */
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

/**
 * Generate month options for the last 12 months
 */
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

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Format a number with thousand separators (Brazilian locale)
 */
function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return value.toLocaleString("pt-BR");
}

/**
 * Format date for display (DD/MM)
 */
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

/**
 * Chart configuration for consumption trend chart
 */
const consumptionChartConfig = {
  qds: {
    label: "QDS (Suprido)",
    color: "hsl(271, 81%, 56%)",
  },
  qdr: {
    label: "QDR (Realizado)",
    color: "hsl(38, 92%, 50%)",
  },
  qdp: {
    label: "QDP (Programado)",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

/**
 * Chart configuration for status distribution
 */
const statusChartConfig = {
  ok: {
    label: "OK",
    color: "hsl(142, 71%, 45%)",
  },
  nok: {
    label: "NOK",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

/**
 * Chart configuration for QDP vs QDR comparison
 */
const comparisonChartConfig = {
  qdp: {
    label: "QDP (Programado)",
    color: "hsl(271, 81%, 56%)",
  },
  qdr: {
    label: "QDR (Realizado)",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

const UNIT_ALL = "__all__";

function ComparisonTooltip({
  active,
  payload,
  label,
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
          <span style={{ color: "hsl(271, 81%, 56%)" }}>QDP (Programado)</span>
          <span className="font-medium">
            {formatValue(entry.qdp)} m³
          </span>
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
          <span className="font-medium">
            {formatValue(entry.qdr)} m³
          </span>
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

function GasReportsPage() {
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isDownloading, setIsDownloading] = useState(false);

  // State for the QDP vs QDR comparison chart
  const [comparisonMonth, setComparisonMonth] = useState(getCurrentMonth());
  const [selectedUnit, setSelectedUnit] = useState(UNIT_ALL);

  // Fetch preview data
  const { data, isLoading, error } = useQuery({
    queryKey: ["gas", "reports", "petrobras", selectedMonth],
    queryFn: async () => {
      const response = await api.gas.reports.petrobras.get({
        query: { month: selectedMonth },
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

  // Fetch consolidated data for QDP vs QDR comparison chart
  const {
    data: consolidatedData,
    isLoading: isLoadingComparison,
  } = useQuery({
    queryKey: ["gas", "consolidated", comparisonMonth],
    queryFn: async () => {
      const response = await api.gas.consolidated.get({
        query: { month: comparisonMonth },
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

  // Unit options for the comparison chart filter
  const unitOptions = useMemo(() => {
    if (!consolidatedData?.units) return [];
    return consolidatedData.units;
  }, [consolidatedData]);

  // Compute tolerance band values from contract
  const toleranceBands = useMemo(() => {
    if (!consolidatedData?.contract) return null;
    const { transportToleranceUpperPercent, transportToleranceLowerPercent } =
      consolidatedData.contract;
    return {
      upperPercent: transportToleranceUpperPercent,
      lowerPercent: transportToleranceLowerPercent,
    };
  }, [consolidatedData]);

  // Transform consolidated data for QDP vs QDR comparison chart
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

      // Calculate tolerance limits based on QDP
      const upperLimit = qdp > 0 ? qdp * (1 + (toleranceBands?.upperPercent ?? 10) / 100) : 0;
      const lowerLimit = qdp > 0 ? qdp * (1 - (toleranceBands?.lowerPercent ?? 20) / 100) : 0;
      const exceedsTolerance = qdp > 0 && (qdr > upperLimit || qdr < lowerLimit);

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

  // Transform data for charts
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
      { name: "NOK", value: data.summary.daysNok, fill: "hsl(0, 84%, 60%)" },
    ];
  }, [data]);

  const totalDays = useMemo(
    () => statusDistribution.reduce((sum, item) => sum + item.value, 0),
    [statusDistribution],
  );

  // Handle download
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.gas.reports.petrobras.download.get({
        query: { month: selectedMonth },
      });

      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(errorObj.error ?? "Falha ao gerar arquivo");
      }

      // The response is already a Blob from Treaty
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
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

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
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Relatórios de Gás
            </h2>
            <p className="text-muted-foreground">
              Visualize e exporte relatórios mensais de consumo de gás.
            </p>
          </div>
        </div>

        {/* QDP vs QDR Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Planejado vs Realizado
            </CardTitle>
            <CardDescription>
              Comparativo diário de QDP (Programado) e QDR (Realizado) com
              faixas de tolerância CUSD
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
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
                    <SelectItem value={UNIT_ALL}>
                      Todas as Unidades
                    </SelectItem>
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

            {/* Chart */}
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
                  {/* Tolerance band as shaded region (green = within) */}
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
                  {/* QDP bars */}
                  <Bar
                    dataKey="qdp"
                    fill="var(--color-qdp)"
                    opacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                  {/* QDR bars — colored by tolerance */}
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
              <div className="flex h-[400px] items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Nenhum dado disponível para o período selecionado.
                </p>
              </div>
            )}

            {/* Legend explanation */}
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

        {/* Controls */}
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

            {/* Summary stats */}
            {data?.summary && (
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">Total de Dias</p>
                  <p className="text-xl font-semibold">
                    {data.summary.totalDays}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs">
                    Dias com Dados
                  </p>
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
          {/* Consumption Trend Chart */}
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
                    {/* QDC reference line */}
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
                    {/* QDS bars */}
                    <Bar
                      dataKey="qds"
                      fill="var(--color-qds)"
                      opacity={0.6}
                      radius={[4, 4, 0, 0]}
                    />
                    {/* QDR bars */}
                    <Bar
                      dataKey="qdr"
                      fill="var(--color-qdr)"
                      opacity={0.8}
                      radius={[4, 4, 0, 0]}
                    />
                    {/* QDP line */}
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
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Nenhum dado disponível para o período selecionado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution Chart */}
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
                      const percent = ((item.value / totalDays) * 100).toFixed(
                        1,
                      );
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
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Nenhum dado disponível.
                  </p>
                </div>
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
      </Main>
    </>
  );
}
