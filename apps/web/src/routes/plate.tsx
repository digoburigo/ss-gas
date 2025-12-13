import { PlateEditor } from "@acme/ui/custom/editor/plate-editor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/plate")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="p-8">
			<PlateEditor />
		</div>
	);
}
