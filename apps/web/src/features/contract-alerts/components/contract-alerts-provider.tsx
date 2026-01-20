import React, { useState } from "react";

import type {
  GasContract,
  GasContractAlert,
  GasContractAlertRecipient,
} from "@acme/zen-v3/zenstack/models";

import useDialogState from "~/hooks/use-dialog-state";

type GasContractAlertWithRelations = GasContractAlert & {
  contract?: GasContract | null;
  recipients?: GasContractAlertRecipient[];
};

type ContractAlertsDialogType =
  | "create"
  | "update"
  | "delete"
  | "toggle-active"
  | "view-history"
  | "manage-recipients";

type ContractAlertsContextType = {
  open: ContractAlertsDialogType | null;
  setOpen: (str: ContractAlertsDialogType | null) => void;
  currentRow: GasContractAlertWithRelations | null;
  setCurrentRow: React.Dispatch<
    React.SetStateAction<GasContractAlertWithRelations | null>
  >;
};

const ContractAlertsContext =
  React.createContext<ContractAlertsContextType | null>(null);

export function ContractAlertsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<ContractAlertsDialogType>(null);
  const [currentRow, setCurrentRow] =
    useState<GasContractAlertWithRelations | null>(null);

  return (
    <ContractAlertsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </ContractAlertsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useContractAlerts = () => {
  const contractAlertsContext = React.useContext(ContractAlertsContext);

  if (!contractAlertsContext) {
    throw new Error(
      "useContractAlerts has to be used within <ContractAlertsProvider>",
    );
  }

  return contractAlertsContext;
};
