import { schema } from "@acme/zen-v3/zenstack/schema";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";
import { authClient } from "~/clients/auth-client";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { ProductsMutateDrawer } from "./products-mutate-drawer";
import { useProducts } from "./products-provider";

export function ProductsDialogs() {
	const { open, setOpen, currentRow, setCurrentRow } = useProducts();
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

	const handleDelete = async () => {
		if (!currentRow || !session?.user?.id) return;

		await deleteProduct({
			data: {
				deletedAt: new Date(),
				deletedById: session.user.id,
			},
			where: { id: currentRow.id },
		});

		setOpen(null);
		setTimeout(() => {
			setCurrentRow(null);
		}, 500);
	};

	return (
		<>
			<ProductsMutateDrawer
				key="product-create"
				open={open === "create"}
				onOpenChange={(v) => {
					if (!v) setOpen(null);
				}}
			/>

			{currentRow && (
				<>
					<ProductsMutateDrawer
						key={`product-update-${currentRow.id}`}
						open={open === "update"}
						onOpenChange={(v) => {
							if (!v) {
								setOpen(null);
								setTimeout(() => {
									setCurrentRow(null);
								}, 500);
							}
						}}
						currentRow={currentRow}
					/>

					<ConfirmDialog
						key="product-delete"
						destructive
						open={open === "delete"}
						onOpenChange={(v) => {
							if (!v) {
								setOpen(null);
								setTimeout(() => {
									setCurrentRow(null);
								}, 500);
							}
						}}
						handleConfirm={handleDelete}
						className="max-w-md"
						title={`Excluir produto: ${currentRow.name}?`}
						desc={
							<>
								Você está prestes a excluir o produto{" "}
								<strong>{currentRow.name}</strong> (código:{" "}
								<strong>{currentRow.code}</strong>). <br />
								Esta ação não pode ser desfeita.
							</>
						}
						confirmText="Excluir"
					/>
				</>
			)}
		</>
	);
}
