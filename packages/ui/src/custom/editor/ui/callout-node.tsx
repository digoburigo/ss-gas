import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { useCalloutEmojiPicker } from "@platejs/callout/react";
import { useEmojiDropdownMenuState } from "@platejs/emoji/react";
import { PlateElement } from "platejs/react";
import type * as React from "react";

import { EmojiPicker, EmojiPopover } from "./emoji-toolbar-button";

export function CalloutElement({
	attributes,
	children,
	className,
	...props
}: React.ComponentProps<typeof PlateElement>) {
	const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState({
		closeOnSelect: true,
	});

	const { emojiToolbarDropdownProps, props: calloutProps } =
		useCalloutEmojiPicker({
			isOpen,
			setIsOpen,
		});

	return (
		<PlateElement
			attributes={{
				...attributes,
				"data-plate-open-context-menu": true,
			}}
			className={cn("bg-muted my-1 flex rounded-sm p-4 pl-3", className)}
			style={{
				backgroundColor: props.element.backgroundColor as any,
			}}
			{...props}
		>
			<div className="flex w-full gap-2 rounded-md">
				<EmojiPopover
					{...emojiToolbarDropdownProps}
					control={
						<Button
							className="hover:bg-muted-foreground/15 size-6 p-1 text-[18px] select-none"
							contentEditable={false}
							style={{
								fontFamily:
									'"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
							}}
							variant="ghost"
						>
							{(props.element.icon as any) || "💡"}
						</Button>
					}
				>
					<EmojiPicker {...emojiPickerState} {...calloutProps} />
				</EmojiPopover>
				<div className="w-full">{children}</div>
			</div>
		</PlateElement>
	);
}
