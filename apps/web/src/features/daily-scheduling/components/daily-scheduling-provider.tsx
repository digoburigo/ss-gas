import React, { useState } from "react";

import type { GasDailyPlan } from "@acme/zen-v3/zenstack/models";

import useDialogState from "~/hooks/use-dialog-state";

type DailySchedulingDialogType =
  | "create"
  | "update"
  | "delete"
  | "submit-to-distributor";

type DailySchedulingContextType = {
  open: DailySchedulingDialogType | null;
  setOpen: (str: DailySchedulingDialogType | null) => void;
  currentRow: GasDailyPlan | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<GasDailyPlan | null>>;
};

const DailySchedulingContext =
  React.createContext<DailySchedulingContextType | null>(null);

export function DailySchedulingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<DailySchedulingDialogType>(null);
  const [currentRow, setCurrentRow] = useState<GasDailyPlan | null>(null);

  return (
    <DailySchedulingContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </DailySchedulingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDailyScheduling = () => {
  const dailySchedulingContext = React.useContext(DailySchedulingContext);

  if (!dailySchedulingContext) {
    throw new Error(
      "useDailyScheduling has to be used within <DailySchedulingProvider>",
    );
  }

  return dailySchedulingContext;
};
