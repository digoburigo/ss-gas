import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@acme/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@acme/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "~/clients/api-client";
import { DailyEntryForm } from "~/components/gas";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

export const Route = createFileRoute("/_authenticated/gas/entry")({
	component: DailyEntryPage,
});

function DailyEntryPage() {
	const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

	const { data: unitsData, isLoading: unitsLoading } = useQuery({
		queryKey: ["gas", "units"],
		queryFn: async () => {
			const response = await api.gas.units.get();
			if (response.error) {
				const errorObj = response.error as { error?: string };
				throw new Error(errorObj.error ?? "Failed to fetch units");
			}
			return response.data;
		},
	});

	const units = unitsData?.units ?? [];
	const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? units[0];

	const submitMutation = useMutation({
		mutationFn: async (data: Parameters<typeof api.gas.entries.post>[0]) => {
			const response = await api.gas.entries.post(data);
			if (response.error) {
				const errorObj = response.error as { error?: string };
				throw new Error(errorObj.error ?? "Failed to create entry");
			}
			return response.data;
		},
		onSuccess: () => {
			toast.success("Lançamento salvo com sucesso!");
		},
		onError: (error: Error) => {
			toast.error(`Erro ao salvar: ${error.message}`);
		},
	});

	return (
		<>
			<Header fixed>
				<h1 className="text-lg font-semibold">Lançamento Diário</h1>
				<div className="ms-auto flex items-center space-x-4">
					<Search />
					<ThemeSwitch />
					<ProfileDropdown />
				</div>
			</Header>

			<Main className="flex flex-1 flex-col gap-4 sm:gap-6">
				<div className="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							Lançamento Diário de Gás
						</h2>
						<p className="text-muted-foreground">
							Registre o consumo diário de gás da unidade
						</p>
					</div>
				</div>

				{/* Unit Selector */}
				<Card>
					<CardHeader>
						<CardTitle>Selecione a Unidade</CardTitle>
						<CardDescription>
							Escolha a unidade para registrar o lançamento diário
						</CardDescription>
					</CardHeader>
					<CardContent>
						{unitsLoading ? (
							<p className="text-muted-foreground text-sm">
								Carregando unidades...
							</p>
						) : units.length > 0 ? (
							<Select
								value={selectedUnitId ?? selectedUnit?.id}
								onValueChange={setSelectedUnitId}
							>
								<SelectTrigger className="w-full max-w-xs">
									<SelectValue placeholder="Selecione uma unidade" />
								</SelectTrigger>
								<SelectContent>
									{units.map((unit) => (
										<SelectItem key={unit.id} value={unit.id}>
											{unit.name} ({unit.code})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<p className="text-muted-foreground text-sm">
								Nenhuma unidade encontrada
							</p>
						)}
					</CardContent>
				</Card>

				{/* Daily Entry Form */}
				{selectedUnit && (
					<DailyEntryForm
						unit={selectedUnit}
						isSubmitting={submitMutation.isPending}
						onSubmit={async (data) => {
							await submitMutation.mutateAsync({
								unitId: selectedUnit.id,
								date: data.date.toISOString(),
								atomizerScheduled: data.atomizerScheduled,
								atomizerHours: data.atomizerHours,
								secondaryAtomizerScheduled: data.secondaryAtomizerScheduled,
								secondaryAtomizerHours: data.secondaryAtomizerHours,
								lineStatuses: data.lineStatuses,
								observations: data.observations,
								qdsManualOverride: data.qdsManualOverride,
								qdsManualValue: data.qdsManualValue,
							});
						}}
					/>
				)}
			</Main>
		</>
	);
}
