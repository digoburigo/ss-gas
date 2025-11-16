import { createFileRoute } from "@tanstack/react-router";

import { PlateEditor } from "@acme/ui/custom/editor/plate-editor";

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
