import { Button } from "@acme/ui/button";
import { useToggleButton, useToggleButtonState } from "@platejs/toggle/react";
import { ChevronRight } from "lucide-react";
import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";

export function ToggleElement(props: PlateElementProps) {
	const element = props.element;
	const state = useToggleButtonState(element.id as string);
	const { buttonProps, open } = useToggleButton(state);

	return (
		<PlateElement {...props} className="pl-6">
			<Button
				className="text-muted-foreground hover:bg-accent absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded-md p-px transition-colors select-none [&_svg]:size-4"
				contentEditable={false}
				size="icon"
				variant="ghost"
				{...buttonProps}
			>
				<ChevronRight
					className={
						open
							? "rotate-90 transition-transform duration-75"
							: "rotate-0 transition-transform duration-75"
					}
				/>
			</Button>
			{props.children}
		</PlateElement>
	);
}
