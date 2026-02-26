"use no memo";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type DrawerMode = "create-entry" | null;

interface SchedulingDashboardContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  drawerOpen: DrawerMode;
  setDrawerOpen: (mode: DrawerMode) => void;
  selectedUnitId: string | null;
  setSelectedUnitId: (unitId: string | null) => void;
}

const SchedulingDashboardContext =
  createContext<SchedulingDashboardContextType | null>(null);

interface SchedulingDashboardProviderProps {
  children: ReactNode;
}

export function SchedulingDashboardProvider({
  children,
}: SchedulingDashboardProviderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [drawerOpen, setDrawerOpen] = useState<DrawerMode>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  return (
    <SchedulingDashboardContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        drawerOpen,
        setDrawerOpen,
        selectedUnitId,
        setSelectedUnitId,
      }}
    >
      {children}
    </SchedulingDashboardContext.Provider>
  );
}

export function useSchedulingDashboard() {
  const context = useContext(SchedulingDashboardContext);
  if (!context) {
    throw new Error(
      "useSchedulingDashboard must be used within a SchedulingDashboardProvider",
    );
  }
  return context;
}
