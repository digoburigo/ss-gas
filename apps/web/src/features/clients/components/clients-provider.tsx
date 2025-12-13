import type { Client } from "@acme/zen-v3/zenstack/models";
import React, { useState } from "react";

import useDialogState from "~/hooks/use-dialog-state";

type ClientsDialogType = "create" | "update" | "delete";

type ClientsContextType = {
	open: ClientsDialogType | null;
	setOpen: (str: ClientsDialogType | null) => void;
	currentRow: Client | null;
	setCurrentRow: React.Dispatch<React.SetStateAction<Client | null>>;
};

const ClientsContext = React.createContext<ClientsContextType | null>(null);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useDialogState<ClientsDialogType>(null);
	const [currentRow, setCurrentRow] = useState<Client | null>(null);

	return (
		<ClientsContext.Provider
			value={{ open, setOpen, currentRow, setCurrentRow }}
		>
			{children}
		</ClientsContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export const useClients = () => {
	const clientsContext = React.useContext(ClientsContext);

	if (!clientsContext) {
		throw new Error("useClients has to be used within <ClientsProvider>");
	}

	return clientsContext;
};
