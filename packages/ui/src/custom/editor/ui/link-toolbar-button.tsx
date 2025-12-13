import { ToolbarButton } from "@acme/ui/toolbar";
import {
	useLinkToolbarButton,
	useLinkToolbarButtonState,
} from "@platejs/link/react";
import { Link } from "lucide-react";
import type * as React from "react";

export function LinkToolbarButton(
	props: React.ComponentProps<typeof ToolbarButton>,
) {
	const state = useLinkToolbarButtonState();
	const { props: buttonProps } = useLinkToolbarButton(state);

	return (
		<ToolbarButton {...props} {...buttonProps} data-plate-focus tooltip="Link">
			<Link />
		</ToolbarButton>
	);
}
