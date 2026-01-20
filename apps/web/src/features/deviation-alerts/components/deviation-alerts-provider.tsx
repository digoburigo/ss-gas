import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type DialogType = "send-email" | "acknowledge" | null;

interface DeviationAlertsContextType {
  // Date range filter
  dateRange: { start: Date; end: Date };
  setDateRange: (range: { start: Date; end: Date }) => void;

  // Unit filter
  selectedUnitId: string | null;
  setSelectedUnitId: (unitId: string | null) => void;

  // Threshold (from admin parameters)
  thresholdPercent: number;
  setThresholdPercent: (threshold: number) => void;

  // Status filter
  statusFilter: string;
  setStatusFilter: (status: string) => void;

  // Dialog state
  open: DialogType;
  setOpen: (type: DialogType) => void;

  // Selected alert for actions
  selectedAlertId: string | null;
  setSelectedAlertId: (id: string | null) => void;
}

const DeviationAlertsContext = createContext<DeviationAlertsContextType | null>(
  null,
);

export function useDeviationAlerts() {
  const context = useContext(DeviationAlertsContext);
  if (!context) {
    throw new Error(
      "useDeviationAlerts must be used within a DeviationAlertsProvider",
    );
  }
  return context;
}

interface DeviationAlertsProviderProps {
  children: ReactNode;
}

export function DeviationAlertsProvider({
  children,
}: DeviationAlertsProviderProps) {
  // Default date range: last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [dateRange, setDateRange] = useState({
    start: sevenDaysAgo,
    end: today,
  });
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [thresholdPercent, setThresholdPercent] = useState(10); // Default 10%
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState<DialogType>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  return (
    <DeviationAlertsContext.Provider
      value={{
        dateRange,
        setDateRange,
        selectedUnitId,
        setSelectedUnitId,
        thresholdPercent,
        setThresholdPercent,
        statusFilter,
        setStatusFilter,
        open,
        setOpen,
        selectedAlertId,
        setSelectedAlertId,
      }}
    >
      {children}
    </DeviationAlertsContext.Provider>
  );
}
