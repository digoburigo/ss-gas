import { AIChatPlugin } from "@platejs/ai/react";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { getPluginTypes, isHotkey, KEYS } from "platejs";

import { BlockSelection } from "../ui/block-selection";

export const BlockSelectionKit = [
	BlockSelectionPlugin.configure(({ editor }) => ({
		options: {
			enableContextMenu: true,
			isSelectable: (element) =>
				!getPluginTypes(editor, [KEYS.column, KEYS.codeLine, KEYS.td]).includes(
					element.type,
				),
			onKeyDownSelecting: (_editor, e) => {
				if (isHotkey("mod+j")(e)) {
					_editor.getApi(AIChatPlugin).aiChat.show();
				}
			},
		},
		render: {
			belowRootNodes: (props) => {
				if (!props.attributes.className?.includes("slate-selectable")) {
					return null;
				}

				return <BlockSelection {...props} />;
			},
		},
	})),
];
