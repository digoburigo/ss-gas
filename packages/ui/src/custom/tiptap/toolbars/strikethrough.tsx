"use client";

import { cn } from "@acme/ui";
import type { ButtonProps } from "@acme/ui/button";
import { Button } from "@acme/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import { Strikethrough } from "lucide-react";
import type React from "react";

import { useToolbar } from "./toolbar-provider";

function StrikeThroughToolbar({
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
						editor?.isActive("strike") && "bg-accent",
						className,
					)}
					disabled={!editor?.can().chain().focus().toggleStrike().run()}
					onClick={(e) => {
						editor?.chain().focus().toggleStrike().run();
						onClick?.(e);
					}}
					ref={ref}
					size="icon"
					variant="ghost"
					{...props}
				>
					{children ?? <Strikethrough className="h-4 w-4" />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<span>Strikethrough</span>
				<span className="text-gray-11 ml-1 text-xs">(cmd + shift + x)</span>
			</TooltipContent>
		</Tooltip>
	);
}

export { StrikeThroughToolbar };
