import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { Download, History } from "lucide-react";

import { schema } from "@acme/zen-v3/zenstack/schema";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@acme/ui/breadcrumb";
import { Button } from "@acme/ui/button";

import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

import { AuditLogFilters } from "./components/audit-log-filters";
import {
  AuditLogProvider,
  useAuditLog,
} from "./components/audit-log-provider";
import { AuditLogSummaryCards } from "./components/audit-log-summary-cards";
import type { AuditLogEntry } from "./components/audit-log-table";
import { AuditLogTable } from "./components/audit-log-table";
import { DetailsDialog } from "./components/details-dialog";
import { ExportDialog } from "./components/export-dialog";

function AuditLogContent() {
  const client = useClientQueries(schema);
  const {
    dateRange,
    selectedEntityType,
    selectedAction,
    selectedUserId,
    searchQuery,
    selectedLogId,
    setOpen,
  } = useAuditLog();

  // Fetch audit logs with filters
  const { data: logs = [], isFetching: isFetchingLogs } =
    client.gasAuditLog.useFindMany({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        ...(selectedEntityType ? { entityType: selectedEntityType } : {}),
        ...(selectedAction
          ? { action: selectedAction as "create" | "update" | "delete" }
          : {}),
        ...(selectedUserId ? { userId: selectedUserId } : {}),
        ...(searchQuery
          ? {
              OR: [
                { entityName: { contains: searchQuery, mode: "insensitive" } },
                { userName: { contains: searchQuery, mode: "insensitive" } },
                { field: { contains: searchQuery, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

  // Fetch members for user filter
  const { data: members = [] } = client.member.useFindMany({
    include: {
      user: true,
    },
  });

  // Transform members to users for the filter
  const users = useMemo(() => {
    const uniqueUsers = new Map<string, { id: string; name: string; email: string }>();
    for (const member of members) {
      if (member.user && !uniqueUsers.has(member.user.id)) {
        uniqueUsers.set(member.user.id, {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
        });
      }
    }
    return Array.from(uniqueUsers.values());
  }, [members]);

  // Transform logs to table format
  const tableData: AuditLogEntry[] = useMemo(() => {
    return logs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName,
      action: log.action,
      field: log.field,
      oldValue: log.oldValue,
      newValue: log.newValue,
      changes: log.changes,
      userId: log.userId,
      userName: log.userName,
      userEmail: log.userEmail,
      createdAt: log.createdAt.toString(),
    }));
  }, [logs]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const createLogs = tableData.filter((l) => l.action === "create");
    const updateLogs = tableData.filter((l) => l.action === "update");
    const deleteLogs = tableData.filter((l) => l.action === "delete");

    const uniqueUserIds = new Set(tableData.map((l) => l.userId).filter(Boolean));

    return {
      totalLogs: tableData.length,
      createCount: createLogs.length,
      updateCount: updateLogs.length,
      deleteCount: deleteLogs.length,
      uniqueUsers: uniqueUserIds.size,
    };
  }, [tableData]);

  // Get selected log for details dialog
  const selectedLog = useMemo(() => {
    if (!selectedLogId) return undefined;
    return tableData.find((l) => l.id === selectedLogId);
  }, [selectedLogId, tableData]);

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
                <Link to="/gas">Gás</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Histórico de Auditoria</BreadcrumbPage>
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
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <History className="text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Histórico de Auditoria
              </h2>
              <p className="text-muted-foreground">
                Acompanhe todas as alterações realizadas no sistema.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setOpen("export")}
            disabled={tableData.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Filters */}
        <AuditLogFilters users={users} />

        {/* Summary Cards */}
        <AuditLogSummaryCards
          totalLogs={summaryStats.totalLogs}
          createCount={summaryStats.createCount}
          updateCount={summaryStats.updateCount}
          deleteCount={summaryStats.deleteCount}
          uniqueUsers={summaryStats.uniqueUsers}
          isLoading={isFetchingLogs}
        />

        {/* Audit Log Table */}
        <AuditLogTable data={tableData} isLoading={isFetchingLogs} />
      </Main>

      {/* Dialogs */}
      <DetailsDialog log={selectedLog} />
      <ExportDialog logs={tableData} />
    </>
  );
}

export function AuditLog() {
  return (
    <AuditLogProvider>
      <AuditLogContent />
    </AuditLogProvider>
  );
}
