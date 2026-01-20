import { Button } from "@acme/ui/button";
import { Plus } from "lucide-react";

import { useOrganizations } from "./organizations-provider";

export function OrganizationsPrimaryButtons() {
	const { setOpen } = useOrganizations();

	return (
		<div className="flex gap-2">
			<Button className="space-x-1" onClick={() => setOpen("create")}>
				<span>Criar</span> <Plus size={18} />
			</Button>
		</div>
	);
}
