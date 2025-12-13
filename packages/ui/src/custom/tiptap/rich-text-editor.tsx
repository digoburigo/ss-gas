import "./tiptap.css";

import { cn } from "@acme/ui";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import type { Extension } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { content } from "../../lib/content";
import { TipTapFloatingMenu } from "./extensions/floating-menu";
import { FloatingToolbar } from "./extensions/floating-toolbar";
import { ImageExtension } from "./extensions/image";
import { ImagePlaceholder } from "./extensions/image-placeholder";
import SearchAndReplace from "./extensions/search-and-replace";
import { EditorToolbar } from "./toolbars/editor-toolbar";

const extensions = [
	StarterKit.configure({
		orderedList: {
			HTMLAttributes: {
				class: "list-decimal",
			},
		},
		bulletList: {
			HTMLAttributes: {
				class: "list-disc",
			},
		},
		heading: {
			levels: [1, 2, 3, 4],
		},
	}),
	Placeholder.configure({
		emptyNodeClass: "is-editor-empty",
		placeholder: ({ node }) => {
			switch (node.type.name) {
				case "heading":
					return `Heading ${node.attrs.level}`;
				case "detailsSummary":
					return "Section title";
				case "codeBlock":
					// never show the placeholder when editing code
					return "";
				default:
					return "Write, type '/' for commands";
			}
		},
		includeChildren: false,
	}),
	TextAlign.configure({
		types: ["heading", "paragraph"],
	}),
	TextStyle,
	Subscript,
	Superscript,
	Underline,
	Link,
	Color,
	Highlight.configure({
		multicolor: true,
	}),
	ImageExtension,
	ImagePlaceholder,
	SearchAndReplace,
	Typography,
];

export function RichTextEditorDemo({ className }: { className?: string }) {
	const editorInstance = useEditor({
		immediatelyRender: false,
		extensions: extensions as Extension[],
		content,
		editorProps: {
			attributes: {
				class: "max-w-full focus:outline-none",
			},
		},
		onUpdate: ({ editor }) => {
			// do what you want to do with output
			// Update stats
			// saving as text/json/hmtml
			// const text = editor.getHTML();
			console.log(editor.getText());
		},
	});

	if (!editorInstance) {
		return null;
	}

	return (
		<div
			className={cn(
				"bg-card relative max-h-[calc(100dvh-6rem)] w-full overflow-hidden overflow-y-scroll border pb-[60px] sm:pb-0",
				className,
			)}
		>
			<EditorToolbar editor={editorInstance} />
			<FloatingToolbar editor={editorInstance} />
			<TipTapFloatingMenu editor={editorInstance} />
			<EditorContent
				className="min-h-[600px] w-full min-w-full cursor-text sm:p-6"
				editor={editorInstance}
			/>
		</div>
	);
}
