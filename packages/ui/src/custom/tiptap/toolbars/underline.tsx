"use client";

import { cn } from "@acme/ui";
import type { ButtonProps } from "@acme/ui/button";
import { Button } from "@acme/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import { UnderlineIcon } from "lucide-react";
import type React from "react";

import { useToolbar } from "./toolbar-provider";

function UnderlineToolbar({
	className,
	onClick,
	children,
	ref,
	...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
	const { editor } = useToolbar();
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					className={cn(
						"h-8 w-8 p-0 sm:h-9 sm:w-9",
						editor?.isActive("underline") && "bg-accent",
						className,
					)}
					disabled={!editor?.can().chain().focus().toggleUnderline().run()}
					onClick={(e) => {
						editor?.chain().focus().toggleUnderline().run();
						onClick?.(e);
					}}
					ref={ref}
					size="icon"
					variant="ghost"
					{...props}
				>
					{children ?? <UnderlineIcon className="h-4 w-4" />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<span>Underline</span>
				<span className="text-gray-11 ml-1 text-xs">(cmd + u)</span>
			</TooltipContent>
		</Tooltip>
	);
}

export { UnderlineToolbar };
