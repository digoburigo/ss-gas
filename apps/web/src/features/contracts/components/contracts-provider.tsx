import React, { useState } from "react";

import type { GasContract } from "@acme/zen-v3/zenstack/models";

import useDialogState from "~/hooks/use-dialog-state";

type ContractsDialogType =
  | "create"
  | "update"
  | "delete"
  | "toggle-active"
  | "view-history";

type ContractsContextType = {
  open: ContractsDialogType | null;
  setOpen: (str: ContractsDialogType | null) => void;
  currentRow: GasContract | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<GasContract | null>>;
};

const ContractsContext = React.createContext<ContractsContextType | null>(null);

export function ContractsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ContractsDialogType>(null);
  const [currentRow, setCurrentRow] = useState<GasContract | null>(null);

  return (
    <ContractsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </ContractsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useContracts = () => {
  const contractsContext = React.useContext(ContractsContext);

  if (!contractsContext) {
    throw new Error("useContracts has to be used within <ContractsProvider>");
  }

  return contractsContext;
};
