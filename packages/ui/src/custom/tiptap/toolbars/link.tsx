"use client";

import { cn } from "@acme/ui";
import type { ButtonProps } from "@acme/ui/button";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import { Trash2, X } from "lucide-react";
/* eslint-disable */
// @ts-nocheck
import { Popover as PopoverPrimitive } from "radix-ui";
import type { FormEvent } from "react";
import React from "react";

import { getUrlFromString } from "../../../lib/tiptap-utils";
import { useToolbar } from "./toolbar-provider";

function LinkToolbar({
	className,
	ref,
	...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
	const { editor } = useToolbar();
	const [link, setLink] = React.useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const url = getUrlFromString(link);
		url && editor?.chain().focus().setLink({ href: url }).run();
	};

	React.useEffect(() => {
		setLink(editor?.getAttributes("link").href ?? "");
	}, [editor]);

	return (
		<Popover>
			<Tooltip>
				<TooltipTrigger asChild>
					<PopoverTrigger
						asChild
						disabled={!editor?.can().chain().setLink({ href: "" }).run()}
					>
						<Button
							className={cn(
								"h-8 w-max px-3 font-normal",
								editor?.isActive("link") && "bg-accent",
								className,
							)}
							ref={ref}
							size="sm"
							variant="ghost"
							{...props}
						>
							<p className="mr-2 text-base">↗</p>
							<p className={"decoration-gray-7 underline underline-offset-4"}>
								Link
							</p>
						</Button>
					</PopoverTrigger>
				</TooltipTrigger>
				<TooltipContent>
					<span>Link</span>
				</TooltipContent>
			</Tooltip>

			<PopoverContent
				asChild
				className="relative px-3 py-2.5"
				onCloseAutoFocus={(e) => {
					e.preventDefault();
				}}
			>
				<div className="relative">
					<PopoverPrimitive.Close className="absolute top-3 right-3">
						<X className="h-4 w-4" />
					</PopoverPrimitive.Close>
					<form onSubmit={handleSubmit}>
						<Label>Link</Label>
						<p className="text-gray-11 text-sm">
							Attach a link to the selected text
						</p>
						<div className="mt-3 flex flex-col items-end justify-end gap-3">
							<Input
								className="w-full"
								onChange={(e) => {
									setLink(e.target.value);
								}}
								placeholder="https://example.com"
								value={link}
							/>
							<div className="flex items-center gap-3">
								{editor?.getAttributes("link").href && (
									<Button
										className="text-gray-11 h-8"
										onClick={() => {
											editor?.chain().focus().unsetLink().run();
											setLink("");
										}}
										size="sm"
										type="reset"
										variant="ghost"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Remove
									</Button>
								)}
								<Button className="h-8" size="sm">
									{editor?.getAttributes("link").href ? "Update" : "Confirm"}
								</Button>
							</div>
						</div>
					</form>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export { LinkToolbar };
