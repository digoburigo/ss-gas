"use client";

import { useTheme } from "@acme/ui/theme";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner, toast } from "sonner";

export const Toaster = ({ ...props }: ToasterProps) => {
	const { themeMode } = useTheme();

	return (
		<Sonner
			className="toaster group"
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
				} as React.CSSProperties
			}
			theme={themeMode === "auto" ? "system" : themeMode}
			{...props}
		/>
	);
};

export { toast };
