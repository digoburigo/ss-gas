import { Button } from "@acme/ui/button";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function ClientsPrimaryButtons() {
	return (
		<div className="flex gap-2">
			<Button asChild className="space-x-1">
				<Link to="/clients/new">
					<span>Criar</span> <Plus size={18} />
				</Link>
			</Button>
		</div>
	);
}
