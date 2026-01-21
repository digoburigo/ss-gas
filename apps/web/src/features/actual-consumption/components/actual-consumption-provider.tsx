import React, { useState } from "react";

import type { GasRealConsumption } from "@acme/zen-v3/zenstack/models";

import useDialogState from "~/hooks/use-dialog-state";

type ActualConsumptionDialogType = "create" | "update" | "delete";

type ActualConsumptionContextType = {
  open: ActualConsumptionDialogType | null;
  setOpen: (str: ActualConsumptionDialogType | null) => void;
  currentRow: GasRealConsumption | null;
  setCurrentRow: React.Dispatch<
    React.SetStateAction<GasRealConsumption | null>
  >;
};

const ActualConsumptionContext =
  React.createContext<ActualConsumptionContextType | null>(null);

export function ActualConsumptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<ActualConsumptionDialogType>(null);
  const [currentRow, setCurrentRow] = useState<GasRealConsumption | null>(null);

  return (
    <ActualConsumptionContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </ActualConsumptionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useActualConsumption = () => {
  const actualConsumptionContext = React.useContext(ActualConsumptionContext);

  if (!actualConsumptionContext) {
    throw new Error(
      "useActualConsumption has to be used within <ActualConsumptionProvider>",
    );
  }

  return actualConsumptionContext;
};
