import type { Client } from "@acme/zen-v3/zenstack/models";
import { schema } from "@acme/zen-v3/zenstack/schema";
import type { Table } from "@tanstack/react-table";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import { authClient } from "~/clients/auth-client";
import { ConfirmDialog } from "~/components/confirm-dialog";

type ClientsMultiDeleteDialogProps<TData> = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	table: Table<TData>;
};

export function ClientsMultiDeleteDialog<TData>({
	open,
	onOpenChange,
	table,
}: ClientsMultiDeleteDialogProps<TData>) {
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedClients = selectedRows.map((row) => row.original as Client);
	const client = useClientQueries(schema);
	const { data: session } = authClient.useSession();

	const { mutateAsync: deleteClient } = client.client.useUpdate({
		onSuccess: () => {
			toast.success("Cliente excluído com sucesso");
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
				selectedClients.map((clientItem) =>
					deleteClient({
						data: {
							deletedAt: new Date(),
							deletedById: session.user.id,
						},
						where: { id: clientItem.id },
					}),
				),
			);
			toast.success(
				`${selectedClients.length} cliente${selectedClients.length > 1 ? "s" : ""} excluído${selectedClients.length > 1 ? "s" : ""} com sucesso`,
			);
			table.resetRowSelection();
			onOpenChange(false);
		} catch (error) {
			toast.error("Erro ao excluir clientes");
		}
	};

	return (
		<ConfirmDialog
			destructive
			open={open}
			onOpenChange={onOpenChange}
			handleConfirm={handleConfirm}
			className="max-w-md"
			title={`Excluir ${selectedClients.length} cliente${selectedClients.length > 1 ? "s" : ""}?`}
			desc={
				<>
					Você está prestes a excluir {selectedClients.length} cliente
					{selectedClients.length > 1 ? "s" : ""}. <br />
					Esta ação não pode ser desfeita.
				</>
			}
			confirmText="Excluir"
		/>
	);
}
