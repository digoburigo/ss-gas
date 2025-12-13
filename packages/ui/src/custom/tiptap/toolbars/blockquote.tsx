"use client";

import { cn } from "@acme/ui";
import type { ButtonProps } from "@acme/ui/button";
import { Button } from "@acme/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import { TextQuote } from "lucide-react";
import type React from "react";

import { useToolbar } from "./toolbar-provider";

function BlockquoteToolbar({
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
						editor?.isActive("blockquote") && "bg-accent",
						className,
					)}
					disabled={!editor?.can().chain().focus().toggleBlockquote().run()}
					onClick={(e) => {
						editor?.chain().focus().toggleBlockquote().run();
						onClick?.(e);
					}}
					ref={ref}
					size="icon"
					variant="ghost"
					{...props}
				>
					{children ?? <TextQuote className="h-4 w-4" />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<span>Blockquote</span>
			</TooltipContent>
		</Tooltip>
	);
}

export { BlockquoteToolbar };
