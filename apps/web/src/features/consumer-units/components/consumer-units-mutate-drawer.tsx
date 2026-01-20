import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@acme/ui/sheet";
import type { GasUnit } from "@acme/zen-v3/zenstack/models";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import { ConsumerUnitForm } from "./consumer-unit-form";

type ConsumerUnitsMutateDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentRow?: GasUnit;
};

export function ConsumerUnitsMutateDrawer({
	open,
	onOpenChange,
	currentRow,
}: ConsumerUnitsMutateDrawerProps) {
	const isUpdate = !!currentRow;
	const client = useClientQueries(schema);

	const { mutate: createUnit, isPending: isCreating } =
		client.gasUnit.useCreate({
			onSuccess: () => {
				toast.success("Unidade consumidora criada com sucesso");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const { mutate: updateUnit, isPending: isUpdating } =
		client.gasUnit.useUpdate({
			onSuccess: () => {
				toast.success("Unidade consumidora atualizada com sucesso");
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const handleSubmit = async (data: {
		code: string;
		name: string;
		description: string;
		address: string;
		city: string;
		state: string;
		zipCode: string;
		responsibleEmails: string[];
		contractId: string;
		active: boolean;
	}) => {
		const payload = {
			code: data.code,
			name: data.name,
			description: data.description || null,
			address: data.address || null,
			city: data.city || null,
			state: data.state || null,
			zipCode: data.zipCode || null,
			responsibleEmails: data.responsibleEmails,
			contractId: data.contractId || null,
			active: data.active,
		};

		if (isUpdate && currentRow) {
			updateUnit({
				data: payload,
				where: { id: currentRow.id },
			});
		} else {
			createUnit({
				data: payload,
			});
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col sm:max-w-lg overflow-y-auto">
				<SheetHeader className="text-start">
					<SheetTitle>
						{isUpdate ? "Editar" : "Criar"} Unidade Consumidora
					</SheetTitle>
					<SheetDescription>
						{isUpdate
							? "Atualize as informações da unidade consumidora."
							: "Adicione uma nova unidade consumidora (ponto de medição) preenchendo as informações abaixo."}
						{" "}Clique em salvar quando terminar.
					</SheetDescription>
				</SheetHeader>
				<div className="flex-1 px-4 py-6">
					<ConsumerUnitForm
						defaultValues={
							currentRow
								? {
										code: currentRow.code,
										name: currentRow.name,
										description: currentRow.description ?? "",
										address: currentRow.address ?? "",
										city: currentRow.city ?? "",
										state: currentRow.state ?? "",
										zipCode: currentRow.zipCode ?? "",
										responsibleEmails: currentRow.responsibleEmails ?? [],
										contractId: currentRow.contractId ?? "",
										active: currentRow.active,
									}
								: undefined
						}
						onSubmit={handleSubmit}
						isSubmitting={isCreating || isUpdating}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
