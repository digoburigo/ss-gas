import type { Product } from "@acme/zen-v3/zenstack/models";
import { schema } from "@acme/zen-v3/zenstack/schema";
import type { Table } from "@tanstack/react-table";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";
import { authClient } from "~/clients/auth-client";
import { ConfirmDialog } from "~/components/confirm-dialog";

type ProductsMultiDeleteDialogProps<TData> = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	table: Table<TData>;
};

export function ProductsMultiDeleteDialog<TData>({
	open,
	onOpenChange,
	table,
}: ProductsMultiDeleteDialogProps<TData>) {
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedProducts = selectedRows.map((row) => row.original as Product);
	const client = useClientQueries(schema);
	const { data: session } = authClient.useSession();

	const { mutateAsync: deleteProduct } = client.product.useUpdate({
		onSuccess: () => {
			toast.success("Produto excluído com sucesso");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleConfirm = async () => {
		if (!session?.user?.id) {
			toast.error("Sessão não encontrada");
			return;
		}

		try {
			await Promise.all(
				selectedProducts.map((product) =>
					deleteProduct({
						data: {
							deletedAt: new Date(),
							deletedById: session.user.id,
						},
						where: { id: product.id },
					}),
				),
			);
			toast.success(
				`${selectedProducts.length} produto${selectedProducts.length > 1 ? "s" : ""} excluído${selectedProducts.length > 1 ? "s" : ""} com sucesso`,
			);
			table.resetRowSelection();
			onOpenChange(false);
		} catch (error) {
			toast.error("Erro ao excluir produtos");
		}
	};

	return (
		<ConfirmDialog
			destructive
			open={open}
			onOpenChange={onOpenChange}
			handleConfirm={handleConfirm}
			className="max-w-md"
			title={`Excluir ${selectedProducts.length} produto${selectedProducts.length > 1 ? "s" : ""}?`}
			desc={
				<>
					Você está prestes a excluir {selectedProducts.length} produto
					{selectedProducts.length > 1 ? "s" : ""}. <br />
					Esta ação não pode ser desfeita.
				</>
			}
			confirmText="Excluir"
		/>
	);
}
