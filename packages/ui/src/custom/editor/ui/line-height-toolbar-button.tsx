import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { ToolbarButton } from "@acme/ui/toolbar";
import { LineHeightPlugin } from "@platejs/basic-styles/react";
import { CheckIcon, WrapText } from "lucide-react";
import { useEditorRef, useSelectionFragmentProp } from "platejs/react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";

export function LineHeightToolbarButton(
	props: DropdownMenuPrimitive.DropdownMenuProps,
) {
	const editor = useEditorRef();
	const { defaultNodeValue, validNodeValues: values = [] } =
		editor.getInjectProps(LineHeightPlugin);

	const value = useSelectionFragmentProp({
		defaultValue: defaultNodeValue,
		getProp: (node) => node.lineHeight,
	});

	const [open, setOpen] = React.useState(false);

	return (
		<DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
			<DropdownMenuTrigger asChild>
				<ToolbarButton isDropdown pressed={open} tooltip="Line height">
					<WrapText />
				</ToolbarButton>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="min-w-0">
				<DropdownMenuRadioGroup
					onValueChange={(newValue) => {
						editor
							.getTransforms(LineHeightPlugin)
							.lineHeight.setNodes(Number(newValue));
						editor.tf.focus();
					}}
					value={value}
				>
					{values.map((value) => (
						<DropdownMenuRadioItem
							className="min-w-[180px] pl-2 *:first:[span]:hidden"
							key={value}
							value={value}
						>
							<span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
								<DropdownMenuPrimitive.DropdownMenuItemIndicator>
									<CheckIcon />
								</DropdownMenuPrimitive.DropdownMenuItemIndicator>
							</span>
							{value}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
