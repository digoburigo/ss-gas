import { useMemo, useEffect } from "react";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import { schema } from "@acme/zen-v3/zenstack/schema";
import type { GasSystemParameter } from "@acme/zen-v3/zenstack/models";

import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

import { calculateDeviationPercent, isDeviationExceedsThreshold } from "./data/data";
import { AcknowledgeDialog } from "./components/acknowledge-dialog";
import { DeviationAlertsFilters } from "./components/deviation-alerts-filters";
import {
  DeviationAlertsProvider,
  useDeviationAlerts,
} from "./components/deviation-alerts-provider";
import { DeviationAlertsSummaryCards } from "./components/deviation-alerts-summary-cards";
import type { DeviationAlert } from "./components/deviation-alerts-table";
import { DeviationAlertsTable } from "./components/deviation-alerts-table";
import { SendEmailDialog } from "./components/send-email-dialog";

function DeviationAlertsContent() {
  const client = useClientQueries(schema);
  const {
    dateRange,
    selectedUnitId,
    thresholdPercent,
    setThresholdPercent,
    statusFilter,
    selectedAlertId,
  } = useDeviationAlerts();

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
  }, [thresholdParam, setThresholdPercent]);

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

  // Process data for deviation alerts
  const alerts: DeviationAlert[] = useMemo(() => {
    const result: DeviationAlert[] = [];

    for (const consumption of consumptions) {
      const dateStr = new Date(consumption.date).toISOString().split("T")[0];

      // Find matching plan for this date
      const plan = consumption.unit.dailyPlans?.find((p) => {
        const planDate = new Date(p.date).toISOString().split("T")[0];
        return planDate === dateStr;
      });

      if (!plan || plan.qdpValue <= 0) continue;

      const scheduled = plan.qdpValue;
      const actual = consumption.qdrValue;
      const deviation = actual - scheduled;
      const deviationPercent = calculateDeviationPercent(scheduled, actual);

      // Only include if deviation exceeds threshold
      if (!isDeviationExceedsThreshold(deviationPercent, thresholdPercent)) {
        continue;
      }

      result.push({
        id: consumption.id,
        date: consumption.date.toString(),
        unitId: consumption.unitId,
        unitName: consumption.unit.name,
        unitCode: consumption.unit.code,
        contractName: consumption.unit.contract?.name ?? null,
        scheduled,
        actual,
        deviation,
        deviationPercent,
        status: "active",
        emailSent: false,
        emailSentAt: null,
      });
    }

    return result;
  }, [consumptions, thresholdPercent]);

  // Filter alerts by status
  const filteredAlerts = useMemo(() => {
    if (statusFilter === "all") return alerts;
    return alerts.filter((a) => a.status === statusFilter);
  }, [alerts, statusFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const overConsumption = alerts.filter((a) => a.deviationPercent > 0);
    const underConsumption = alerts.filter((a) => a.deviationPercent < 0);
    const emailsSent = alerts.filter((a) => a.emailSent);
    const activeAlerts = alerts.filter((a) => a.status === "active");

    return {
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      overConsumptionCount: overConsumption.length,
      underConsumptionCount: underConsumption.length,
      emailsSentCount: emailsSent.length,
    };
  }, [alerts]);

  // Get selected alert for dialogs
  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return undefined;
    return alerts.find((a) => a.id === selectedAlertId);
  }, [selectedAlertId, alerts]);

  // Get responsible emails for unit
  const unitResponsibleEmails = useMemo(() => {
    if (!selectedAlert) return [];
    const unit = units.find((u) => u.id === selectedAlert.unitId);
    return unit?.responsibleEmails ?? [];
  }, [selectedAlert, units]);

  // Handle sending email (would integrate with email service)
  const handleSendEmail = (
    alertId: string,
    recipients: string[],
    message: string,
  ) => {
    // TODO: Implement email sending via API
    console.log("Sending email:", { alertId, recipients, message });
  };

  // Handle acknowledging alert (would update record)
  const handleAcknowledge = (alertId: string, notes: string) => {
    // TODO: Implement status update via mutation
    console.log("Acknowledging alert:", { alertId, notes });
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
              Alertas de Desvio de Programação
            </h2>
            <p className="text-muted-foreground">
              Monitore desvios significativos entre consumo programado e
              realizado e gerencie alertas automáticos.
            </p>
          </div>
        </div>

        {/* Filters */}
        <DeviationAlertsFilters
          units={units.map((u) => ({
            id: u.id,
            name: u.name,
            code: u.code,
          }))}
        />

        {/* Summary Cards */}
        <DeviationAlertsSummaryCards
          totalAlerts={summaryStats.totalAlerts}
          activeAlerts={summaryStats.activeAlerts}
          overConsumptionCount={summaryStats.overConsumptionCount}
          underConsumptionCount={summaryStats.underConsumptionCount}
          emailsSentCount={summaryStats.emailsSentCount}
          thresholdPercent={thresholdPercent}
          isLoading={isFetchingConsumptions}
        />

        {/* Alerts Table */}
        <DeviationAlertsTable
          data={filteredAlerts}
          isLoading={isFetchingConsumptions}
        />
      </Main>

      {/* Dialogs */}
      <SendEmailDialog
        alert={selectedAlert}
        onSend={handleSendEmail}
        unitResponsibleEmails={unitResponsibleEmails}
      />
      <AcknowledgeDialog
        alert={selectedAlert}
        onAcknowledge={handleAcknowledge}
      />
    </>
  );
}

export function DeviationAlerts() {
  return (
    <DeviationAlertsProvider>
      <DeviationAlertsContent />
    </DeviationAlertsProvider>
  );
}
