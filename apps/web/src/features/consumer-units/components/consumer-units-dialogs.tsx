import { schema } from "@acme/zen-v3/zenstack/schema";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { useState } from "react";
import { toast } from "sonner";

import { apiClient } from "~/clients/api-client";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { ConsumerUnitsMutateDrawer } from "./consumer-units-mutate-drawer";
import { useConsumerUnits } from "./consumer-units-provider";

export function ConsumerUnitsDialogs() {
	const { open, setOpen, currentRow, setCurrentRow } = useConsumerUnits();
	const client = useClientQueries(schema);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const { mutateAsync: updateUnit } = client.gasUnit.useUpdate({
		onSuccess: () => {
			toast.success("Unidade consumidora atualizada com sucesso");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutateAsync: deleteUnit } = client.gasUnit.useDelete({
		onSuccess: () => {
			toast.success("Unidade consumidora excluída com sucesso");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleToggleActive = async () => {
		if (!currentRow) return;

		await updateUnit({
			data: {
				active: !currentRow.active,
			},
			where: { id: currentRow.id },
		});

		setOpen(null);
		setTimeout(() => {
			setCurrentRow(null);
		}, 500);
	};

	const handleDelete = async () => {
		if (!currentRow) return;
		setDeleteError(null);

		// First check if unit has pending schedules via API endpoint
		try {
			const response = await apiClient.api.gas["consumer-units"][
				currentRow.id
			]["can-delete"].get();

			if (response.data && !response.data.canDelete) {
				setDeleteError(
					response.data.reason ||
						"Não é possível excluir esta unidade pois ela possui agendamentos pendentes.",
				);
				return;
			}

			await deleteUnit({
				where: { id: currentRow.id },
			});

			setOpen(null);
			setTimeout(() => {
				setCurrentRow(null);
			}, 500);
		} catch {
			// If API check fails, proceed with delete attempt (ZenStack will handle validation)
			try {
				await deleteUnit({
					where: { id: currentRow.id },
				});

				setOpen(null);
				setTimeout(() => {
					setCurrentRow(null);
				}, 500);
			} catch (deleteError) {
				const errorMessage =
					deleteError instanceof Error ? deleteError.message : "Erro ao excluir";
				toast.error(errorMessage);
			}
		}
	};

	return (
		<>
			<ConsumerUnitsMutateDrawer
				key="consumer-unit-create"
				open={open === "create"}
				onOpenChange={(v) => {
					if (!v) setOpen(null);
				}}
			/>

			{currentRow && (
				<>
					<ConsumerUnitsMutateDrawer
						key={`consumer-unit-update-${currentRow.id}`}
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
						key="consumer-unit-toggle-active"
						open={open === "toggle-active"}
						onOpenChange={(v) => {
							if (!v) {
								setOpen(null);
								setTimeout(() => {
									setCurrentRow(null);
								}, 500);
							}
						}}
						handleConfirm={handleToggleActive}
						className="max-w-md"
						title={`${currentRow.active ? "Desativar" : "Ativar"} unidade: ${currentRow.name}?`}
						desc={
							currentRow.active ? (
								<>
									Você está prestes a desativar a unidade consumidora{" "}
									<strong>{currentRow.name}</strong>. <br />
									Agendamentos futuros não poderão ser criados para esta unidade
									enquanto ela estiver inativa.
								</>
							) : (
								<>
									Você está prestes a ativar a unidade consumidora{" "}
									<strong>{currentRow.name}</strong>. <br />
									Agendamentos poderão ser criados novamente para esta unidade.
								</>
							)
						}
						confirmText={currentRow.active ? "Desativar" : "Ativar"}
					/>

					<ConfirmDialog
						key="consumer-unit-delete"
						destructive
						open={open === "delete"}
						onOpenChange={(v) => {
							if (!v) {
								setOpen(null);
								setDeleteError(null);
								setTimeout(() => {
									setCurrentRow(null);
								}, 500);
							}
						}}
						handleConfirm={handleDelete}
						className="max-w-md"
						title={`Excluir unidade: ${currentRow.name}?`}
						desc={
							<>
								{deleteError ? (
									<p className="text-destructive mb-2">{deleteError}</p>
								) : null}
								Você está prestes a excluir a unidade consumidora{" "}
								<strong>{currentRow.name}</strong>. <br />
								<strong className="text-destructive">
									Esta ação é irreversível e removerá todos os dados associados
									(equipamentos, lançamentos e agendamentos).
								</strong>
							</>
						}
						confirmText="Excluir"
					/>
				</>
			)}
		</>
	);
}
