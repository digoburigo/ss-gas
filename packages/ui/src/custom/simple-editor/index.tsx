import {
	BoldPlugin,
	ItalicPlugin,
	UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import { Plate, usePlateEditor } from "platejs/react";
import { Editor, EditorContainer } from "./editor";
import { FixedToolbar } from "./fixed-toolbar";
import { MarkToolbarButton } from "./mark-toolbar-button";

export function SimpleEditor() {
	const editor = usePlateEditor({
		plugins: [BoldPlugin, ItalicPlugin, UnderlinePlugin],
	});

	return (
		<Plate editor={editor}>
			<FixedToolbar className="justify-start rounded-t-lg">
				<MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
					B
				</MarkToolbarButton>
				<MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
					I
				</MarkToolbarButton>
				<MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
					U
				</MarkToolbarButton>
			</FixedToolbar>
			<EditorContainer>
				<Editor placeholder="Type your amazing content here..." />
			</EditorContainer>
		</Plate>
	);
}
