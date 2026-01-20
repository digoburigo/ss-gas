"use no memo";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

interface SchedulingDashboardContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
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

  return (
    <SchedulingDashboardContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
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
