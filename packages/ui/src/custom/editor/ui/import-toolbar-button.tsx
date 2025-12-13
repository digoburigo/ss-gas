import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { ToolbarButton } from "@acme/ui/toolbar";
import { MarkdownPlugin } from "@platejs/markdown";
import { ArrowUpToLineIcon } from "lucide-react";
import { useEditorRef } from "platejs/react";
import { getEditorDOMFromHtmlString } from "platejs/static";
import type { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";
import { useFilePicker } from "use-file-picker";

type ImportType = "html" | "markdown";

export function ImportToolbarButton(
	props: DropdownMenuPrimitive.DropdownMenuProps,
) {
	const editor = useEditorRef();
	const [open, setOpen] = React.useState(false);

	const getFileNodes = (text: string, type: ImportType) => {
		if (type === "html") {
			const editorNode = getEditorDOMFromHtmlString(text);
			const nodes = editor.api.html.deserialize({
				element: editorNode,
			});

			return nodes;
		}

		if (type === "markdown") {
			return editor.getApi(MarkdownPlugin).markdown.deserialize(text);
		}

		return [];
	};

	const { openFilePicker: openMdFilePicker } = useFilePicker({
		accept: [".md", ".mdx"],
		multiple: false,
		onFilesSelected: async ({ plainFiles }) => {
			const text = await plainFiles[0].text();

			const nodes = getFileNodes(text, "markdown");

			editor.tf.insertNodes(nodes);
		},
	});

	const { openFilePicker: openHtmlFilePicker } = useFilePicker({
		accept: ["text/html"],
		multiple: false,
		onFilesSelected: async ({ plainFiles }) => {
			const text = await plainFiles[0].text();

			const nodes = getFileNodes(text, "html");

			editor.tf.insertNodes(nodes);
		},
	});

	return (
		<DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
			<DropdownMenuTrigger asChild>
				<ToolbarButton isDropdown pressed={open} tooltip="Import">
					<ArrowUpToLineIcon className="size-4" />
				</ToolbarButton>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					<DropdownMenuItem
						onSelect={() => {
							openHtmlFilePicker();
						}}
					>
						Import from HTML
					</DropdownMenuItem>

					<DropdownMenuItem
						onSelect={() => {
							openMdFilePicker();
						}}
					>
						Import from Markdown
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
