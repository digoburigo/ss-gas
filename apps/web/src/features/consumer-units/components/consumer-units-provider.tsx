import type { GasUnit } from "@acme/zen-v3/zenstack/models";
import React, { useState } from "react";

import useDialogState from "~/hooks/use-dialog-state";

type ConsumerUnitsDialogType = "create" | "update" | "delete" | "toggle-active";

type ConsumerUnitsContextType = {
	open: ConsumerUnitsDialogType | null;
	setOpen: (str: ConsumerUnitsDialogType | null) => void;
	currentRow: GasUnit | null;
	setCurrentRow: React.Dispatch<React.SetStateAction<GasUnit | null>>;
};

const ConsumerUnitsContext =
	React.createContext<ConsumerUnitsContextType | null>(null);

export function ConsumerUnitsProvider({
	children,
}: { children: React.ReactNode }) {
	const [open, setOpen] = useDialogState<ConsumerUnitsDialogType>(null);
	const [currentRow, setCurrentRow] = useState<GasUnit | null>(null);

	return (
		<ConsumerUnitsContext.Provider
			value={{ open, setOpen, currentRow, setCurrentRow }}
		>
			{children}
		</ConsumerUnitsContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export const useConsumerUnits = () => {
	const consumerUnitsContext = React.useContext(ConsumerUnitsContext);

	if (!consumerUnitsContext) {
		throw new Error(
			"useConsumerUnits has to be used within <ConsumerUnitsProvider>",
		);
	}

	return consumerUnitsContext;
};
