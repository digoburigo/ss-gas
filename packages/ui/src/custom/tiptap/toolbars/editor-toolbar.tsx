import { ScrollArea, ScrollBar } from "@acme/ui/scroll-area";
import { Separator } from "@acme/ui/separator";
import { TooltipProvider } from "@acme/ui/tooltip";
import type { Editor } from "@tiptap/core";

import { AlignmentTooolbar } from "./alignment";
import { BlockquoteToolbar } from "./blockquote";
import { BoldToolbar } from "./bold";
import { BulletListToolbar } from "./bullet-list";
import { CodeToolbar } from "./code";
import { CodeBlockToolbar } from "./code-block";
import { ColorHighlightToolbar } from "./color-and-highlight";
import { HeadingsToolbar } from "./headings";
import { HorizontalRuleToolbar } from "./horizontal-rule";
import { ImagePlaceholderToolbar } from "./image-placeholder-toolbar";
import { ItalicToolbar } from "./italic";
import { LinkToolbar } from "./link";
import { OrderedListToolbar } from "./ordered-list";
import { RedoToolbar } from "./redo";
import { SearchAndReplaceToolbar } from "./search-and-replace-toolbar";
import { StrikeThroughToolbar } from "./strikethrough";
import { ToolbarProvider } from "./toolbar-provider";
import { UnderlineToolbar } from "./underline";
import { UndoToolbar } from "./undo";

export const EditorToolbar = ({ editor }: { editor: Editor }) => {
	return (
		<div className="bg-background sticky top-0 z-20 hidden w-full border-b sm:block">
			<ToolbarProvider editor={editor}>
				<TooltipProvider>
					<ScrollArea className="h-fit py-0.5">
						<div>
							<div className="flex items-center gap-1 px-2">
								{/* History Group */}
								<UndoToolbar />
								<RedoToolbar />
								<Separator className="mx-1 h-7" orientation="vertical" />

								{/* Text Structure Group */}
								<HeadingsToolbar />
								<BlockquoteToolbar />
								<CodeToolbar />
								<CodeBlockToolbar />
								<Separator className="mx-1 h-7" orientation="vertical" />

								{/* Basic Formatting Group */}
								<BoldToolbar />
								<ItalicToolbar />
								<UnderlineToolbar />
								<StrikeThroughToolbar />
								<LinkToolbar />
								<Separator className="mx-1 h-7" orientation="vertical" />

								{/* Lists & Structure Group */}
								<BulletListToolbar />
								<OrderedListToolbar />
								<HorizontalRuleToolbar />
								<Separator className="mx-1 h-7" orientation="vertical" />

								{/* Alignment Group */}
								<AlignmentTooolbar />
								<Separator className="mx-1 h-7" orientation="vertical" />

								{/* Media & Styling Group */}
								<ImagePlaceholderToolbar />
								<ColorHighlightToolbar />
								<Separator className="mx-1 h-7" orientation="vertical" />

								<div className="flex-1" />

								{/* Utility Group */}
								<SearchAndReplaceToolbar />
							</div>
						</div>
						<ScrollBar className="hidden" orientation="horizontal" />
					</ScrollArea>
				</TooltipProvider>
			</ToolbarProvider>
		</div>
	);
};
