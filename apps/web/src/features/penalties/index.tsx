import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Calendar,
  Download,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Skeleton } from "@acme/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";

import { api } from "~/clients/api-client";
import { ConfigDrawer } from "~/components/config-drawer";
import { ContractSelector } from "~/components/gas/contract-selector";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { TariffManagementTab } from "./components/tariff-management-tab";

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function ComparisonBadge({
  current,
  previous,
  invertColors = false,
}: {
  current: number;
  previous: number;
  invertColors?: boolean;
}) {
  if (previous === 0 && current === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        <Minus className="mr-1 h-3 w-3" />
        Sem variação
      </Badge>
    );
  }

  const diff = current - previous;
  const pctChange = previous !== 0 ? (diff / previous) * 100 : 100;
  const isUp = diff > 0;

  // For penalties, up = bad (red), down = good (green)
  // invertColors flips this behavior
  const isGood = invertColors ? isUp : !isUp;
  const colorClass =
    diff === 0
      ? "text-muted-foreground"
      : isGood
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";

  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <Badge variant="outline" className={`text-xs ${colorClass}`}>
      <Icon className="mr-1 h-3 w-3" />
      {isUp ? "+" : ""}
      {pctChange.toFixed(1)}%
    </Badge>
  );
}

export function Penalties() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [selectedContractId, setSelectedContractId] = useState("");

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["penalties", selectedMonth, selectedContractId],
    queryFn: async () => {
      const response = await api.gas.penalties.get({
        query: {
          month: selectedMonth,
          ...(selectedContractId ? { contractId: selectedContractId } : {}),
        },
      });

      if (response.error) {
        throw new Error(
          typeof response.error === "object" && "error" in response.error
            ? (response.error as { error: string }).error
            : "Erro ao carregar penalidades",
        );
      }

      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleDownload = async () => {
    const params = new URLSearchParams({ month: selectedMonth });
    if (selectedContractId) params.set("contractId", selectedContractId);

    const response = await api.gas.penalties.download.get({
      query: {
        month: selectedMonth,
        ...(selectedContractId ? { contractId: selectedContractId } : {}),
      },
    });

    if (response.error || !response.data) return;

    const blob = new Blob([response.data as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `penalidades-${selectedMonth}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Penalidades</h2>
            <p className="text-muted-foreground">
              Acompanhe os cálculos de penalidades diárias e mensais por desvios
              de programação.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data?.contracts && data.contracts.length > 1 && (
              <ContractSelector
                contracts={data.contracts}
                value={selectedContractId || data.contract.id}
                onChange={setSelectedContractId}
              />
            )}
            <div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  disabled={!data || isLoading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar Excel</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Erro ao carregar penalidades"}
              </p>
            </CardContent>
          </Card>
        )}

        {data && !isLoading && (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="PVEMA"
                description="Excedente acima"
                value={data.currentTotals.pvema}
                prevValue={data.prevTotals.pvema}
                icon={<ArrowUp className="h-4 w-4 text-red-500" />}
              />
              <SummaryCard
                title="PVEME"
                description="Excedente abaixo"
                value={data.currentTotals.pveme}
                prevValue={data.prevTotals.pveme}
                icon={<ArrowDown className="h-4 w-4 text-blue-500" />}
              />
              <SummaryCard
                title="Sobredemanda"
                description="Excesso de consumo"
                value={data.currentTotals.sobredemanda}
                prevValue={data.prevTotals.sobredemanda}
                icon={<Ban className="h-4 w-4 text-orange-500" />}
              />
              <SummaryCard
                title="Total"
                description="Penalidades acumuladas"
                value={data.currentTotals.total}
                prevValue={data.prevTotals.total}
                icon={<Ban className="h-4 w-4 text-destructive" />}
                highlight
              />
            </div>

            <Tabs defaultValue="daily" className="space-y-4">
              <TabsList>
                <TabsTrigger value="daily">Visão Diária</TabsTrigger>
                <TabsTrigger value="monthly">Visão Mensal</TabsTrigger>
                <TabsTrigger value="tariffs">Tarifas</TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                <Card>
                  <CardHeader>
                    <CardTitle>Penalidades Diárias</CardTitle>
                    <CardDescription>
                      Detalhamento diário por unidade com tipo de penalidade,
                      valor calculado e fórmula aplicada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.dailyRows.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground text-sm">
                          Nenhum dado de consumo encontrado para este mês.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Unidade</TableHead>
                              <TableHead className="text-right">
                                QDR (m³)
                              </TableHead>
                              <TableHead className="text-right">
                                QDC (m³)
                              </TableHead>
                              <TableHead className="text-right">
                                Lim. Superior
                              </TableHead>
                              <TableHead className="text-right">
                                Lim. Inferior
                              </TableHead>
                              <TableHead className="text-right">
                                PVEMA
                              </TableHead>
                              <TableHead className="text-right">
                                PVEME
                              </TableHead>
                              <TableHead className="text-right">
                                Sobredem.
                              </TableHead>
                              <TableHead className="text-right">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.dailyRows.map((row) => {
                              const hasPenalty = row.total > 0;
                              return (
                                <TableRow
                                  key={`${row.date}-${row.unitId}`}
                                  className={
                                    hasPenalty
                                      ? "bg-red-50/50 dark:bg-red-950/10"
                                      : ""
                                  }
                                >
                                  <TableCell className="text-sm font-mono truncate">
                                    {formatDate(row.date)}
                                  </TableCell>
                                  <TableCell className="text-sm truncate">
                                    {row.unitCode}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate">
                                    {formatNumber(row.qdrValue)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate">
                                    {formatNumber(row.qdcContracted)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate">
                                    {formatNumber(row.upperLimit)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate">
                                    {formatNumber(row.lowerLimit)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate">
                                    {row.pvema > 0 ? (
                                      <span className="text-red-600 dark:text-red-400">
                                        {formatCurrency(row.pvema)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate">
                                    {row.pveme > 0 ? (
                                      <span className="text-blue-600 dark:text-blue-400">
                                        {formatCurrency(row.pveme)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate">
                                    {row.sobredemanda > 0 ? (
                                      <span className="text-orange-600 dark:text-orange-400">
                                        {formatCurrency(row.sobredemanda)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono truncate font-semibold">
                                    {row.total > 0 ? (
                                      <span className="text-red-600 dark:text-red-400">
                                        {formatCurrency(row.total)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="font-semibold"
                              >
                                Total do Mês
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(data.currentTotals.pvema)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(data.currentTotals.pveme)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(
                                  data.currentTotals.sobredemanda,
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(data.currentTotals.total)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly">
                <Card>
                  <CardHeader>
                    <CardTitle>Totais Mensais por Unidade</CardTitle>
                    <CardDescription>
                      Penalidades acumuladas por unidade e tipo, com comparação
                      ao mês anterior ({data.prevMonth})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.monthlyRows.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground text-sm">
                          Nenhum dado de consumo encontrado para este mês.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Unidade</TableHead>
                              <TableHead className="text-right">
                                Dias
                              </TableHead>
                              <TableHead className="text-right">
                                PVEMA (R$)
                              </TableHead>
                              <TableHead className="text-right">
                                PVEME (R$)
                              </TableHead>
                              <TableHead className="text-right">
                                Sobredemanda (R$)
                              </TableHead>
                              <TableHead className="text-right">
                                Total (R$)
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.monthlyRows.map((row) => (
                              <TableRow key={row.unitId}>
                                <TableCell className="font-medium">
                                  {row.unitCode} — {row.unitName}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono">
                                  {row.days}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono truncate">
                                  {row.pvema > 0 ? (
                                    <span className="text-red-600 dark:text-red-400">
                                      {formatCurrency(row.pvema)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono truncate">
                                  {row.pveme > 0 ? (
                                    <span className="text-blue-600 dark:text-blue-400">
                                      {formatCurrency(row.pveme)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono truncate">
                                  {row.sobredemanda > 0 ? (
                                    <span className="text-orange-600 dark:text-orange-400">
                                      {formatCurrency(row.sobredemanda)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono truncate font-semibold">
                                  {row.total > 0 ? (
                                    <span className="text-red-600 dark:text-red-400">
                                      {formatCurrency(row.total)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell className="font-semibold">
                                Total
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {data.monthlyRows.reduce(
                                  (s, r) => s + r.days,
                                  0,
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(data.currentTotals.pvema)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(data.currentTotals.pveme)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(
                                  data.currentTotals.sobredemanda,
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-semibold">
                                {formatCurrency(data.currentTotals.total)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}

                    {/* Comparison with previous month */}
                    {data.prevTotals.total > 0 ||
                    data.currentTotals.total > 0 ? (
                      <div className="mt-6 rounded-lg border p-4">
                        <h4 className="mb-3 text-sm font-semibold">
                          Comparação com mês anterior ({data.prevMonth})
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              PVEMA
                            </span>
                            <ComparisonBadge
                              current={data.currentTotals.pvema}
                              previous={data.prevTotals.pvema}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              PVEME
                            </span>
                            <ComparisonBadge
                              current={data.currentTotals.pveme}
                              previous={data.prevTotals.pveme}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">
                              Sobredemanda
                            </span>
                            <ComparisonBadge
                              current={data.currentTotals.sobredemanda}
                              previous={data.prevTotals.sobredemanda}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm font-semibold">
                              Total
                            </span>
                            <ComparisonBadge
                              current={data.currentTotals.total}
                              previous={data.prevTotals.total}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tariffs">
                <TariffManagementTab
                  contractId={selectedContractId || data.contract.id}
                  contracts={data.contracts ?? [data.contract]}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </Main>
    </>
  );
}

function SummaryCard({
  title,
  description,
  value,
  prevValue,
  icon,
  highlight,
}: {
  title: string;
  description: string;
  value: number;
  prevValue: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-destructive/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-lg font-bold font-mono truncate">
              {formatCurrency(value)}
            </div>
          </TooltipTrigger>
          <TooltipContent>{formatCurrency(value)}</TooltipContent>
        </Tooltip>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-muted-foreground text-xs">{description}</p>
          <ComparisonBadge current={value} previous={prevValue} />
        </div>
      </CardContent>
    </Card>
  );
}
