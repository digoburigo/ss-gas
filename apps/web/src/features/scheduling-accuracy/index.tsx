import { useMemo } from "react";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { AccuracyFilters } from "./components/accuracy-filters";
import type { AccuracyRecord } from "./components/accuracy-history-table";
import { AccuracyHistoryTable } from "./components/accuracy-history-table";
import { AccuracySummaryCards } from "./components/accuracy-summary-cards";
import { AccuracyTrendChart } from "./components/accuracy-trend-chart";
import { CauseAnalysisDialog } from "./components/cause-analysis-dialog";
import { CauseDistributionChart } from "./components/cause-distribution-chart";
import {
  SchedulingAccuracyProvider,
  useSchedulingAccuracy,
} from "./components/scheduling-accuracy-provider";
import { calculateAccuracyRate, calculateDeviationPercent } from "./data/data";

function SchedulingAccuracyContent() {
  const client = useClientQueries(schema);
  const { period, selectedUnitId, dateRange, selectedRecordId } =
    useSchedulingAccuracy();

  // Fetch units for filter dropdown
  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // Fetch real consumption data with plans
  const { data: consumptions = [], isFetching: isFetchingConsumptions } =
    client.gasRealConsumption.useFindMany({
      where: {
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        ...(selectedUnitId ? { unitId: selectedUnitId } : {}),
      },
      include: {
        unit: {
          include: {
            contract: true,
            dailyPlans: {
              where: {
                date: {
                  gte: dateRange.start,
                  lte: dateRange.end,
                },
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

  // Process data for accuracy records
  const accuracyRecords: AccuracyRecord[] = useMemo(() => {
    return consumptions
      .map((consumption) => {
        const dateStr = new Date(consumption.date).toISOString().split("T")[0];

        // Find matching plan for this date
        const plan = consumption.unit.dailyPlans?.find((p) => {
          const planDate = new Date(p.date).toISOString().split("T")[0];
          return planDate === dateStr;
        });

        if (!plan || plan.qdpValue <= 0) return null;

        const scheduled = plan.qdpValue;
        const actual = consumption.qdrValue;
        const accuracy = calculateAccuracyRate(scheduled, actual);
        const deviation = actual - scheduled;
        const deviationPercent = calculateDeviationPercent(scheduled, actual);
        const tolerance =
          consumption.unit.contract?.transportToleranceUpperPercent ?? 10;
        const withinTolerance = Math.abs(deviationPercent) <= tolerance;

        return {
          id: consumption.id,
          date: consumption.date.toString(),
          unitId: consumption.unitId,
          unitName: consumption.unit.name,
          unitCode: consumption.unit.code,
          contractName: consumption.unit.contract?.name || null,
          scheduled,
          actual,
          accuracy,
          deviation,
          deviationPercent,
          withinTolerance,
          cause: consumption.notes?.startsWith("CAUSE:")
            ? consumption.notes.split(":")[1]?.split("|")[0] || null
            : null,
          causeNotes: consumption.notes?.startsWith("CAUSE:")
            ? consumption.notes.split("|")[1] || null
            : consumption.notes,
        };
      })
      .filter((r): r is AccuracyRecord => r !== null);
  }, [consumptions]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (accuracyRecords.length === 0) {
      return {
        averageAccuracy: 0,
        totalRecords: 0,
        withinToleranceCount: 0,
        outsideToleranceCount: 0,
      };
    }

    const totalAccuracy = accuracyRecords.reduce(
      (sum, r) => sum + r.accuracy,
      0,
    );
    const withinTolerance = accuracyRecords.filter(
      (r) => r.withinTolerance,
    ).length;

    return {
      averageAccuracy: totalAccuracy / accuracyRecords.length,
      totalRecords: accuracyRecords.length,
      withinToleranceCount: withinTolerance,
      outsideToleranceCount: accuracyRecords.length - withinTolerance,
    };
  }, [accuracyRecords]);

  // Prepare chart data based on period
  const chartData = useMemo(() => {
    if (accuracyRecords.length === 0) return [];

    if (period === "daily") {
      // Group by day
      return accuracyRecords.map((r) => ({
        date: r.date,
        displayDate: new Date(r.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          timeZone: "UTC",
        }),
        accuracy: r.accuracy,
        scheduled: r.scheduled,
        actual: r.actual,
        deviation: r.deviation,
        deviationPercent: r.deviationPercent,
        withinTolerance: r.withinTolerance,
      }));
    }

    if (period === "weekly") {
      // Group by week
      const weeklyData = new Map<
        string,
        {
          dates: string[];
          accuracies: number[];
          scheduled: number;
          actual: number;
        }
      >();

      for (const record of accuracyRecords) {
        const date = new Date(record.date);
        // Get the Monday of the week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        const weekKey = monday.toISOString().split("T")[0] ?? "";

        const existing = weeklyData.get(weekKey) || {
          dates: [] as string[],
          accuracies: [] as number[],
          scheduled: 0,
          actual: 0,
        };
        existing.dates.push(record.date);
        existing.accuracies.push(record.accuracy);
        existing.scheduled += record.scheduled;
        existing.actual += record.actual;
        weeklyData.set(weekKey, existing);
      }

      return Array.from(weeklyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekStart, data]) => {
          const avgAccuracy =
            data.accuracies.reduce((s, a) => s + a, 0) / data.accuracies.length;
          const deviation = data.actual - data.scheduled;
          const deviationPercent =
            data.scheduled > 0 ? (deviation / data.scheduled) * 100 : 0;

          return {
            date: weekStart,
            displayDate: `Sem ${new Date(weekStart).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              timeZone: "UTC",
            })}`,
            accuracy: avgAccuracy,
            scheduled: data.scheduled,
            actual: data.actual,
            deviation,
            deviationPercent,
            withinTolerance: Math.abs(deviationPercent) <= 10,
          };
        });
    }

    // Monthly
    const monthlyData = new Map<
      string,
      {
        accuracies: number[];
        scheduled: number;
        actual: number;
      }
    >();

    for (const record of accuracyRecords) {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthlyData.get(monthKey) || {
        accuracies: [],
        scheduled: 0,
        actual: 0,
      };
      existing.accuracies.push(record.accuracy);
      existing.scheduled += record.scheduled;
      existing.actual += record.actual;
      monthlyData.set(monthKey, existing);
    }

    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, data]) => {
        const avgAccuracy =
          data.accuracies.reduce((s, a) => s + a, 0) / data.accuracies.length;
        const deviation = data.actual - data.scheduled;
        const deviationPercent =
          data.scheduled > 0 ? (deviation / data.scheduled) * 100 : 0;

        const [year, month] = monthKey.split("-");
        const monthNames = [
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

        return {
          date: monthKey,
          displayDate: `${monthNames[Number(month) - 1]}/${year}`,
          accuracy: avgAccuracy,
          scheduled: data.scheduled,
          actual: data.actual,
          deviation,
          deviationPercent,
          withinTolerance: Math.abs(deviationPercent) <= 10,
        };
      });
  }, [accuracyRecords, period]);

  // Prepare cause distribution data
  const causeDistribution = useMemo(() => {
    const causeCounts = new Map<string, number>();

    for (const record of accuracyRecords) {
      if (record.cause) {
        causeCounts.set(record.cause, (causeCounts.get(record.cause) || 0) + 1);
      }
    }

    return Array.from(causeCounts.entries())
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count);
  }, [accuracyRecords]);

  // Get selected record for dialog
  const selectedRecord = useMemo(() => {
    if (!selectedRecordId) return undefined;
    const record = accuracyRecords.find((r) => r.id === selectedRecordId);
    if (!record) return undefined;
    return {
      date: record.date,
      unitName: record.unitName,
      accuracy: record.accuracy,
      deviation: record.deviation,
    };
  }, [selectedRecordId, accuracyRecords]);

  // Handle saving cause analysis
  const handleSaveCause = (recordId: string, cause: string, notes: string) => {
    // In a real implementation, this would update the record via mutation
    // For now, we'll just log it since the notes field is already used
    console.log("Saving cause analysis:", { recordId, cause, notes });
    // TODO: Implement mutation to update the record's notes field
    // Format: "CAUSE:{cause}|{notes}"
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
            <h2 className="text-2xl font-bold tracking-tight">
              Taxa de Acurácia de Programação
            </h2>
            <p className="text-muted-foreground">
              Analise a precisão das programações e identifique oportunidades de
              melhoria.
            </p>
          </div>
        </div>

        {/* Filters */}
        <AccuracyFilters
          units={units.map((u) => ({
            id: u.id,
            name: u.name,
            code: u.code,
          }))}
        />

        {/* Summary Cards */}
        <AccuracySummaryCards
          averageAccuracy={summaryStats.averageAccuracy}
          totalRecords={summaryStats.totalRecords}
          withinToleranceCount={summaryStats.withinToleranceCount}
          outsideToleranceCount={summaryStats.outsideToleranceCount}
          isLoading={isFetchingConsumptions}
        />

        {/* Tabs for different views */}
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trend">Tendência</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="causes">Análise de Causas</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            <AccuracyTrendChart
              data={chartData}
              period={period}
              isLoading={isFetchingConsumptions}
            />
          </TabsContent>

          <TabsContent value="history">
            <AccuracyHistoryTable
              data={accuracyRecords}
              isLoading={isFetchingConsumptions}
            />
          </TabsContent>

          <TabsContent value="causes">
            <CauseDistributionChart
              data={causeDistribution}
              isLoading={isFetchingConsumptions}
            />
          </TabsContent>
        </Tabs>
      </Main>

      {/* Dialogs */}
      <CauseAnalysisDialog
        onSave={handleSaveCause}
        recordDetails={selectedRecord}
      />
    </>
  );
}

export function SchedulingAccuracy() {
  return (
    <SchedulingAccuracyProvider>
      <SchedulingAccuracyContent />
    </SchedulingAccuracyProvider>
  );
}
