import React, { useState } from "react";

type PeriodType = "daily" | "weekly" | "monthly";

type AccuracyDialogType = "cause-analysis" | null;

type AccuracyContextType = {
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  selectedUnitId: string | null;
  setSelectedUnitId: (unitId: string | null) => void;
  dateRange: { start: Date; end: Date };
  setDateRange: (range: { start: Date; end: Date }) => void;
  open: AccuracyDialogType;
  setOpen: (dialog: AccuracyDialogType) => void;
  selectedRecordId: string | null;
  setSelectedRecordId: (id: string | null) => void;
};

const AccuracyContext = React.createContext<AccuracyContextType | null>(null);

// Get default date range (current month)
function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

export function SchedulingAccuracyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [open, setOpen] = useState<AccuracyDialogType>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  return (
    <AccuracyContext.Provider
      value={{
        period,
        setPeriod,
        selectedUnitId,
        setSelectedUnitId,
        dateRange,
        setDateRange,
        open,
        setOpen,
        selectedRecordId,
        setSelectedRecordId,
      }}
    >
      {children}
    </AccuracyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSchedulingAccuracy = () => {
  const context = React.useContext(AccuracyContext);

  if (!context) {
    throw new Error(
      "useSchedulingAccuracy has to be used within <SchedulingAccuracyProvider>",
    );
  }

  return context;
};
