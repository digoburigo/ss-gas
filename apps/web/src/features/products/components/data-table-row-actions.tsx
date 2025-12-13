import { Button } from "@acme/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import type { Product } from "@acme/zen-v3/zenstack/models";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import type { Row } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useProducts } from "./products-provider";

type DataTableRowActionsProps<TData> = {
	row: Row<TData>;
};

export function DataTableRowActions<TData>({
	row,
}: DataTableRowActionsProps<TData>) {
	const product = row.original as Product;

	const { setOpen, setCurrentRow } = useProducts();

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
				>
					<DotsHorizontalIcon className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[160px]">
				<DropdownMenuItem asChild>
					<Link
						to="/products/$productId"
						params={{ productId: product.id }}
						className="cursor-pointer"
					>
						Editar
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => {
						setCurrentRow(product);
						setOpen("delete");
					}}
				>
					Excluir
					<DropdownMenuShortcut>
						<Trash2 size={16} />
					</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
