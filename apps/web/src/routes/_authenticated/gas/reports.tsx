import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
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

function GasReportsPage() {
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isDownloading, setIsDownloading] = useState(false);

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
