import { ToolbarButton } from "@acme/ui/toolbar";
import { MessageSquareTextIcon } from "lucide-react";
import { useEditorRef } from "platejs/react";

import { commentPlugin } from "../plugins/comment-kit";

export function CommentToolbarButton() {
	const editor = useEditorRef();

	return (
		<ToolbarButton
			data-plate-prevent-overlay
			onClick={() => {
				editor.getTransforms(commentPlugin).comment.setDraft();
			}}
			tooltip="Comment"
		>
			<MessageSquareTextIcon />
		</ToolbarButton>
	);
}
