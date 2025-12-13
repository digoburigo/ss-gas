"use client";

import { cn } from "@acme/ui";
import type { ButtonProps } from "@acme/ui/button";
import { Button } from "@acme/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import { Code2 } from "lucide-react";
import type React from "react";

import { useToolbar } from "./toolbar-provider";

function CodeToolbar({
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
						editor?.isActive("code") && "bg-accent",
						className,
					)}
					disabled={!editor?.can().chain().focus().toggleCode().run()}
					onClick={(e) => {
						editor?.chain().focus().toggleCode().run();
						onClick?.(e);
					}}
					ref={ref}
					size="icon"
					variant="ghost"
					{...props}
				>
					{children ?? <Code2 className="h-4 w-4" />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<span>Code</span>
			</TooltipContent>
		</Tooltip>
	);
}

export { CodeToolbar };
