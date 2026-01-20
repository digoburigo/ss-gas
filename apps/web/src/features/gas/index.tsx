import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Calculator,
  FileText,
  Gauge,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";

import type { GasSystemParameter } from "@acme/zen-v3/zenstack/models";
import { schema } from "@acme/zen-v3/zenstack/schema";

import type { ChartConfig } from "@acme/ui/chart";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@acme/ui/breadcrumb";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";

import { api } from "~/clients/api-client";
import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { DeviationAlertIndicator } from "~/features/deviation-alerts/components/deviation-alert-indicator";
import {
  calculateDeviationPercent,
  isDeviationExceedsThreshold,
} from "~/features/deviation-alerts/data/data";

/**
 * Format a number with thousand separators and unit
 */
function formatValue(value: number | undefined | null, unit = "m³"): string {
  if (value === undefined || value === null) {
    return "-";
  }
  return `${value.toLocaleString("pt-BR")} ${unit}`;
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
 * Tolerance status type matching API response
 */
type TransportStatus = "within" | "exceeded_upper" | "exceeded_lower";
type MoleculeStatus = "within" | "exceeded";

/**
 * Get tolerance indicator color based on status and proximity to limits
 * - Green: within tolerance bands
 * - Yellow: approaching limits (within 5% of boundary)
 * - Red: tolerance exceeded
 */
function getToleranceColor(
  status: TransportStatus | MoleculeStatus,
  deviationPercent: number,
  tolerancePercent: number,
): "green" | "yellow" | "red" {
  if (status !== "within") {
    return "red";
  }

  // Check if approaching limits (within 5% of boundary)
  const proximityThreshold = tolerancePercent * 0.05; // 5% of the tolerance band
  const distanceToLimit = tolerancePercent - Math.abs(deviationPercent);

  if (distanceToLimit <= proximityThreshold) {
    return "yellow";
  }

  return "green";
}

/**
 * Get CSS classes for tolerance indicator
 */
function getToleranceClasses(color: "green" | "yellow" | "red"): {
  bg: string;
  text: string;
  border: string;
} {
  switch (color) {
    case "green":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        border: "border-l-green-500",
      };
    case "yellow":
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
        border: "border-l-yellow-500",
      };
    case "red":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        border: "border-l-red-500",
      };
  }
}

/**
 * Format deviation percentage
 */
function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/**
 * Chart configuration for the monthly trend chart
 */
const trendChartConfig = {
  qds: {
    label: "QDS - Previsto",
    color: "hsl(38, 92%, 50%)",
  },
  qdp: {
    label: "QDP - Programado",
    color: "hsl(271, 81%, 56%)",
  },
  qdr: {
    label: "QDR - Real",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

export function GasDashboard() {
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const client = useClientQueries(schema);
  const [thresholdPercent, setThresholdPercent] = useState(10);

  // Fetch threshold from admin parameters
  const { data: thresholdParam } = client.gasSystemParameter.useFindFirst({
    where: {
      category: "alert_thresholds",
      key: "deviation_threshold_percent",
      active: true,
    },
  });

  // Update threshold when parameter is loaded
  useEffect(() => {
    if (thresholdParam) {
      const value = Number.parseFloat((thresholdParam as GasSystemParameter).value);
      if (!Number.isNaN(value)) {
        setThresholdPercent(value);
      }
    }
  }, [thresholdParam]);

  // Fetch last 7 days of real consumption for deviation alerts
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  const { data: recentConsumptions = [], isFetching: isFetchingConsumptions } =
    client.gasRealConsumption.useFindMany({
      where: {
        date: {
          gte: sevenDaysAgo,
          lte: new Date(),
        },
      },
      include: {
        unit: {
          include: {
            dailyPlans: {
              where: {
                date: {
                  gte: sevenDaysAgo,
                  lte: new Date(),
                },
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

  // Calculate deviation alerts
  const deviationAlertsSummary = useMemo(() => {
    const alerts: Array<{
      unitName: string;
      deviationPercent: number;
      date: string;
    }> = [];

    for (const consumption of recentConsumptions) {
      const dateStr = new Date(consumption.date).toISOString().split("T")[0];
      const plan = consumption.unit.dailyPlans?.find((p) => {
        const planDate = new Date(p.date).toISOString().split("T")[0];
        return planDate === dateStr;
      });

      if (!plan || plan.qdpValue <= 0) continue;

      const deviationPercent = calculateDeviationPercent(
        plan.qdpValue,
        consumption.qdrValue,
      );

      if (isDeviationExceedsThreshold(deviationPercent, thresholdPercent)) {
        alerts.push({
          unitName: consumption.unit.name,
          deviationPercent,
          date: consumption.date.toString(),
        });
      }
    }

    return {
      activeAlertsCount: alerts.length,
      latestAlert: alerts.length > 0 ? alerts[0] : undefined,
    };
  }, [recentConsumptions, thresholdPercent]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["gas", "consolidated", currentMonth],
    queryFn: async () => {
      const response = await api.gas.consolidated.get({
        query: { month: currentMonth },
      });
      if (response.error) {
        const errorObj = response.error as { error?: string };
        throw new Error(errorObj.error ?? "Failed to fetch consolidated data");
      }
      return response.data;
    },
  });

  // Calculate monthly totals from daily summaries
  const monthlyTotals = useMemo(() => {
    if (!data?.dailySummaries || data.dailySummaries.length === 0) {
      return {
        qdc: data?.contract?.qdcContracted ?? null,
        qds: null,
        qdp: null,
        qdr: null,
      };
    }

    // Sum up all daily values for the month
    const totals = data.dailySummaries.reduce(
      (acc, day) => ({
        qds: acc.qds + day.qdsTotal,
        qdp: acc.qdp + day.qdpTotal,
        qdr: acc.qdr + day.qdrTotal,
      }),
      { qds: 0, qdp: 0, qdr: 0 },
    );

    return {
      qdc: data.contract?.qdcContracted ?? null,
      qds: totals.qds > 0 ? totals.qds : null,
      qdp: totals.qdp > 0 ? totals.qdp : null,
      qdr: totals.qdr > 0 ? totals.qdr : null,
    };
  }, [data]);

  // Calculate aggregated tolerance status from daily summaries
  const toleranceSummary = useMemo(() => {
    if (
      !data?.dailySummaries ||
      data.dailySummaries.length === 0 ||
      !data.contract
    ) {
      return null;
    }

    // Get the latest day's data for current status (or aggregate)
    const latestDay = data.dailySummaries[data.dailySummaries.length - 1];
    if (!latestDay) return null;

    const transportColor = getToleranceColor(
      latestDay.transportStatus,
      latestDay.deviations.transportDeviationPercent,
      Math.max(
        data.contract.transportToleranceUpperPercent,
        data.contract.transportToleranceLowerPercent,
      ),
    );

    const moleculeColor = getToleranceColor(
      latestDay.moleculeStatus,
      latestDay.deviations.moleculeDeviationPercent,
      data.contract.moleculeTolerancePercent,
    );

    return {
      transport: {
        status: latestDay.transportStatus,
        color: transportColor,
        classes: getToleranceClasses(transportColor),
        deviation: latestDay.deviations.transportDeviation,
        deviationPercent: latestDay.deviations.transportDeviationPercent,
        upperLimit: latestDay.deviations.transportUpperLimit,
        lowerLimit: latestDay.deviations.transportLowerLimit,
        toleranceUpper: data.contract.transportToleranceUpperPercent,
        toleranceLower: data.contract.transportToleranceLowerPercent,
      },
      molecule: {
        status: latestDay.moleculeStatus,
        color: moleculeColor,
        classes: getToleranceClasses(moleculeColor),
        deviation: latestDay.deviations.moleculeDeviation,
        deviationPercent: latestDay.deviations.moleculeDeviationPercent,
        upperLimit: latestDay.deviations.moleculeUpperLimit,
        lowerLimit: latestDay.deviations.moleculeLowerLimit,
        tolerance: data.contract.moleculeTolerancePercent,
      },
    };
  }, [data]);

  // Prepare data for the trend chart
  const chartData = useMemo(() => {
    if (!data?.dailySummaries || data.dailySummaries.length === 0) {
      return { data: [], toleranceBands: null };
    }

    // Transform daily summaries to chart format
    const transformedData = data.dailySummaries.map((day) => ({
      date: new Date(day.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      fullDate: new Date(day.date).toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
      qds: day.qdsTotal,
      qdp: day.qdpTotal > 0 ? day.qdpTotal : null,
      qdr: day.qdrTotal > 0 ? day.qdrTotal : null,
      transportUpperLimit: day.deviations.transportUpperLimit,
      transportLowerLimit: day.deviations.transportLowerLimit,
      moleculeUpperLimit: day.deviations.moleculeUpperLimit,
      moleculeLowerLimit: day.deviations.moleculeLowerLimit,
    }));

    // Calculate tolerance bands from contract data
    const contract = data.contract;
    const qdc = contract.qdcContracted;
    const transportUpper =
      qdc * (1 + contract.transportToleranceUpperPercent / 100);
    const transportLower =
      qdc * (1 - contract.transportToleranceLowerPercent / 100);

    return {
      data: transformedData,
      toleranceBands: {
        transportUpper,
        transportLower,
        qdc,
      },
    };
  }, [data]);

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
              <BreadcrumbPage>Gas</BreadcrumbPage>
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
              Controle de Gás
            </h2>
            <p className="text-muted-foreground">
              Gerencie o consumo de gás das unidades.
            </p>
          </div>
        </div>

        {/* Summary Cards - QDC, QDS, QDP, QDR */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* QDC Card - Contracted Daily Quantity */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                QDC - Contratado
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Carregando..." : formatValue(monthlyTotals.qdc)}
              </div>
              <p className="text-muted-foreground text-xs">
                Quantidade Diária Contratada
              </p>
            </CardContent>
          </Card>

          {/* QDS Card - Calculated/Forecasted Consumption */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                QDS - Previsto
              </CardTitle>
              <Calculator className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Carregando..." : formatValue(monthlyTotals.qds)}
              </div>
              <p className="text-muted-foreground text-xs">
                Consumo Calculado/Previsto
              </p>
            </CardContent>
          </Card>

          {/* QDP Card - Programmed Quantity */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                QDP - Programado
              </CardTitle>
              <Gauge className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Carregando..." : formatValue(monthlyTotals.qdp)}
              </div>
              <p className="text-muted-foreground text-xs">
                Quantidade Diária Programada
              </p>
            </CardContent>
          </Card>

          {/* QDR Card - Real Consumption */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QDR - Real</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Carregando..." : formatValue(monthlyTotals.qdr)}
              </div>
              <p className="text-muted-foreground text-xs">
                Consumo Real dos Medidores
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tolerance Band Indicators */}
        {toleranceSummary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Transport Tolerance Card */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card
                  className={`cursor-help border-l-4 ${toleranceSummary.transport.classes.border}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tolerância de Transporte
                    </CardTitle>
                    {toleranceSummary.transport.deviationPercent >= 0 ? (
                      <TrendingUp
                        className={`h-4 w-4 ${toleranceSummary.transport.classes.text}`}
                      />
                    ) : (
                      <TrendingDown
                        className={`h-4 w-4 ${toleranceSummary.transport.classes.text}`}
                      />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${toleranceSummary.transport.classes.bg}`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full ${
                            toleranceSummary.transport.color === "green"
                              ? "bg-green-500"
                              : toleranceSummary.transport.color === "yellow"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                      </div>
                      <div>
                        <div
                          className={`text-2xl font-bold ${toleranceSummary.transport.classes.text}`}
                        >
                          {formatPercent(
                            toleranceSummary.transport.deviationPercent,
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Faixa: -{toleranceSummary.transport.toleranceLower}% /
                          +{toleranceSummary.transport.toleranceUpper}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">
                    Detalhes da Tolerância de Transporte
                  </p>
                  <p>
                    Desvio: {formatValue(toleranceSummary.transport.deviation)}
                  </p>
                  <p>
                    Limite Superior:{" "}
                    {formatValue(toleranceSummary.transport.upperLimit)}
                  </p>
                  <p>
                    Limite Inferior:{" "}
                    {formatValue(toleranceSummary.transport.lowerLimit)}
                  </p>
                  <p>
                    Status:{" "}
                    {toleranceSummary.transport.status === "within"
                      ? "Dentro da faixa"
                      : toleranceSummary.transport.status === "exceeded_upper"
                        ? "Excedeu limite superior"
                        : "Excedeu limite inferior"}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Molecule Tolerance Card */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card
                  className={`cursor-help border-l-4 ${toleranceSummary.molecule.classes.border}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tolerância de Molécula
                    </CardTitle>
                    {toleranceSummary.molecule.deviationPercent >= 0 ? (
                      <TrendingUp
                        className={`h-4 w-4 ${toleranceSummary.molecule.classes.text}`}
                      />
                    ) : (
                      <TrendingDown
                        className={`h-4 w-4 ${toleranceSummary.molecule.classes.text}`}
                      />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${toleranceSummary.molecule.classes.bg}`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full ${
                            toleranceSummary.molecule.color === "green"
                              ? "bg-green-500"
                              : toleranceSummary.molecule.color === "yellow"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                      </div>
                      <div>
                        <div
                          className={`text-2xl font-bold ${toleranceSummary.molecule.classes.text}`}
                        >
                          {formatPercent(
                            toleranceSummary.molecule.deviationPercent,
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Faixa: ±{toleranceSummary.molecule.tolerance}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">
                    Detalhes da Tolerância de Molécula
                  </p>
                  <p>
                    Desvio: {formatValue(toleranceSummary.molecule.deviation)}
                  </p>
                  <p>
                    Limite Superior:{" "}
                    {formatValue(toleranceSummary.molecule.upperLimit)}
                  </p>
                  <p>
                    Limite Inferior:{" "}
                    {formatValue(toleranceSummary.molecule.lowerLimit)}
                  </p>
                  <p>
                    Status:{" "}
                    {toleranceSummary.molecule.status === "within"
                      ? "Dentro da faixa"
                      : "Fora da faixa"}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Deviation Alert Indicator */}
            <DeviationAlertIndicator
              activeAlertsCount={deviationAlertsSummary.activeAlertsCount}
              latestAlert={deviationAlertsSummary.latestAlert}
              isLoading={isFetchingConsumptions}
            />
          </div>
        )}

        {/* Deviation Alert Indicator (shown when no tolerance summary) */}
        {!toleranceSummary && (
          <div className="grid gap-4 sm:grid-cols-3">
            <DeviationAlertIndicator
              activeAlertsCount={deviationAlertsSummary.activeAlertsCount}
              latestAlert={deviationAlertsSummary.latestAlert}
              isLoading={isFetchingConsumptions}
            />
          </div>
        )}

        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal de Consumo</CardTitle>
            <CardDescription>
              Visualização diária de QDS, QDP e QDR com faixas de tolerância
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[350px] items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Carregando gráfico...
                </p>
              </div>
            ) : chartData.data.length > 0 ? (
              <ChartContainer
                config={trendChartConfig}
                className="aspect-auto h-[350px] w-full"
              >
                <LineChart
                  data={chartData.data}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <defs>
                    {/* Gradient for tolerance band shading */}
                    <linearGradient
                      id="toleranceBand"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(142, 71%, 45%)"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="50%"
                        stopColor="hsl(142, 71%, 45%)"
                        stopOpacity={0.08}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(142, 71%, 45%)"
                        stopOpacity={0.15}
                      />
                    </linearGradient>
                  </defs>
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
                    domain={["auto", "auto"]}
                  />
                  {/* Tolerance band as shaded region */}
                  {chartData.toleranceBands && (
                    <ReferenceArea
                      y1={chartData.toleranceBands.transportLower}
                      y2={chartData.toleranceBands.transportUpper}
                      fill="url(#toleranceBand)"
                      fillOpacity={1}
                      stroke="hsl(142, 71%, 45%)"
                      strokeOpacity={0.3}
                      strokeDasharray="4 4"
                    />
                  )}
                  <ChartTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          if (typeof value === "string") {
                            return value;
                          }
                          return String(value);
                        }}
                        indicator="line"
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {/* QDS Line - Previsto (Amber) */}
                  <Line
                    dataKey="qds"
                    type="monotone"
                    stroke="var(--color-qds)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-qds)" }}
                    activeDot={{ r: 5 }}
                  />
                  {/* QDP Line - Programado (Purple) */}
                  <Line
                    dataKey="qdp"
                    type="monotone"
                    stroke="var(--color-qdp)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-qdp)" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  {/* QDR Line - Real (Green) */}
                  <Line
                    dataKey="qdr"
                    type="monotone"
                    stroke="var(--color-qdr)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-qdr)" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[350px] items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Nenhum dado disponível para o mês selecionado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error display */}
        {error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">
                Erro ao carregar dados: {error.message}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Units Section */}
        <Card>
          <CardHeader>
            <CardTitle>Unidades</CardTitle>
            <CardDescription>
              Selecione uma unidade para gerenciar os lançamentos diários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">
                Carregando unidades...
              </p>
            ) : data?.units && data.units.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.units.map((unit) => (
                  <Card
                    key={unit.id}
                    className="hover:bg-accent cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{unit.name}</div>
                      <div className="text-muted-foreground text-sm">
                        Código: {unit.code}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhuma unidade encontrada.
              </p>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
