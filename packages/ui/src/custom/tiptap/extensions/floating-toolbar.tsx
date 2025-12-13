"use client";

import { ScrollArea, ScrollBar } from "@acme/ui/scroll-area";
import { Separator } from "@acme/ui/separator";
import { TooltipProvider } from "@acme/ui/tooltip";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEffect } from "react";

import { useMediaQuery } from "../../../hooks/use-media-query";
import { AlignmentTooolbar } from "../toolbars/alignment";
import { BlockquoteToolbar } from "../toolbars/blockquote";
import { BoldToolbar } from "../toolbars/bold";
import { BulletListToolbar } from "../toolbars/bullet-list";
import { ColorHighlightToolbar } from "../toolbars/color-and-highlight";
import { HeadingsToolbar } from "../toolbars/headings";
import { ImagePlaceholderToolbar } from "../toolbars/image-placeholder-toolbar";
import { ItalicToolbar } from "../toolbars/italic";
import { LinkToolbar } from "../toolbars/link";
import { OrderedListToolbar } from "../toolbars/ordered-list";
import { ToolbarProvider } from "../toolbars/toolbar-provider";
import { UnderlineToolbar } from "../toolbars/underline";

export function FloatingToolbar({ editor }: { editor: Editor | null }) {
	const isMobile = useMediaQuery("(max-width: 640px)");

	// Prevent default context menu on mobile
	useEffect(() => {
		if (!(editor?.options.element && isMobile)) return;

		const handleContextMenu = (e: Event) => {
			e.preventDefault();
		};

		const el = editor.options.element;
		el.addEventListener("contextmenu", handleContextMenu);

		return () => el.removeEventListener("contextmenu", handleContextMenu);
	}, [editor, isMobile]);

	if (!editor) return null;

	if (isMobile) {
		return (
			<TooltipProvider>
				<BubbleMenu
					className="bg-background mx-0 w-full min-w-full rounded-sm border shadow-sm"
					editor={editor}
					shouldShow={() => {
						// Show toolbar when editor is focused and has selection
						return editor.isEditable && editor.isFocused;
					}}
					tippyOptions={{
						duration: 100,
						placement: "bottom",
						offset: [0, 10],
					}}
				>
					<ToolbarProvider editor={editor}>
						<ScrollArea className="h-fit w-full py-0.5">
							<div className="flex items-center gap-0.5 px-2">
								<div className="flex items-center gap-0.5 p-1">
									{/* Primary formatting */}
									<BoldToolbar />
									<ItalicToolbar />
									<UnderlineToolbar />
									<Separator className="mx-1 h-6" orientation="vertical" />

									{/* Structure controls */}
									<HeadingsToolbar />
									<BulletListToolbar />
									<OrderedListToolbar />
									<Separator className="mx-1 h-6" orientation="vertical" />

									{/* Rich formatting */}
									<ColorHighlightToolbar />
									<LinkToolbar />
									<ImagePlaceholderToolbar />
									<Separator className="mx-1 h-6" orientation="vertical" />

									{/* Additional controls */}
									<AlignmentTooolbar />
									<BlockquoteToolbar />
								</div>
							</div>
							<ScrollBar className="h-0.5" orientation="horizontal" />
						</ScrollArea>
					</ToolbarProvider>
				</BubbleMenu>
			</TooltipProvider>
		);
	}

	return null;
}
