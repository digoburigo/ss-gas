import { Badge } from "@acme/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@acme/ui/breadcrumb";
import { Button } from "@acme/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@acme/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@acme/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@acme/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@acme/ui/table";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	Edit2,
	Factory,
	History,
	Loader2,
	Settings,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/clients/api-client";
import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

export const Route = createFileRoute("/_authenticated/gas/admin")({
	component: GasAdminPage,
});

/**
 * Format a number with thousand separators (Brazilian locale)
 */
function formatValue(value: number | null | undefined): string {
	if (value === null || value === undefined) {
		return "-";
	}
	return value.toLocaleString("pt-BR");
}

/**
 * Format date for display (DD/MM/YYYY)
 */
function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("pt-BR");
}

/**
 * Format datetime for display (DD/MM/YYYY HH:MM)
 */
function formatDateTime(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Get equipment type label in Portuguese
 */
function getEquipmentTypeLabel(type: string): string {
	switch (type) {
		case "atomizer":
			return "Atomizador";
		case "line":
			return "Linha";
		case "dryer":
			return "Secador";
		default:
			return type;
	}
}

/**
 * Get consumption unit label
 */
function getConsumptionUnitLabel(unit: string): string {
	switch (unit) {
		case "m3_per_hour":
			return "m³/h";
		case "m3_per_day":
			return "m³/dia";
		default:
			return unit;
	}
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

interface Equipment {
	id: string;
	unitId: string;
	code: string;
	name: string;
	type: string;
	active: boolean;
	orderIndex: number;
	createdAt: Date;
	updatedAt: Date;
	constants: Array<{
		id: string;
		equipmentId: string;
		consumptionRate: number;
		consumptionUnit: string;
		effectiveFrom: Date;
		effectiveTo: Date | null;
		notes: string | null;
		createdAt: Date;
		createdById: string | null;
	}>;
}

interface Unit {
	id: string;
	code: string;
	name: string;
	description: string | null;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
	organizationId: string | null;
	equipment: Equipment[];
}

interface HistoryEntry {
	id: string;
	consumptionRate: number;
	consumptionUnit: string;
	effectiveFrom: Date;
	effectiveTo: Date | null;
	notes: string | null;
	createdAt: Date;
	createdBy: {
		id: string;
		name: string;
		email: string;
	} | null;
}

interface HistoryData {
	equipment: {
		id: string;
		code: string;
		name: string;
		type: string;
	};
	unit: {
		id: string;
		code: string;
		name: string;
	};
	history: HistoryEntry[];
}

function GasAdminPage() {
	const queryClient = useQueryClient();
	const zenstack = useClientQueries(schema);
	const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
	const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
	const [historyEquipmentId, setHistoryEquipmentId] = useState<string | null>(
		null,
	);

	// Form state for editing
	const [newRate, setNewRate] = useState("");
	const [newUnit, setNewUnit] = useState<"m3_per_hour" | "m3_per_day">(
		"m3_per_hour",
	);
	const [effectiveDate, setEffectiveDate] = useState(getTodayDate());
	const [notes, setNotes] = useState("");

	// Fetch units with equipment using ZenStack
	const { data: unitsData, isLoading } = zenstack.gasUnit.useFindMany({
		include: {
			equipment: {
				orderBy: { orderIndex: "asc" },
				include: {
					constants: {
						orderBy: { effectiveFrom: "desc" },
						take: 1, // Only get current constant
					},
				},
			},
		},
		orderBy: { code: "asc" },
	});

	// Transform ZenStack data to match existing Unit[] interface
	const units = unitsData as Unit[] | undefined;

	// Fetch history for selected equipment using ZenStack
	const { data: historyConstants, isLoading: isLoadingHistory } =
		zenstack.gasEquipmentConstant.useFindMany(
			{
				where: { equipmentId: historyEquipmentId ?? undefined },
				include: {
					createdByUser: { select: { id: true, name: true, email: true } },
					equipment: { include: { unit: true } },
				},
				orderBy: { effectiveFrom: "desc" },
			},
			{
				enabled: !!historyEquipmentId,
			},
		);

	// Transform history data to match existing HistoryData interface
	const historyData: HistoryData | null =
		historyConstants && historyConstants.length > 0 && historyConstants[0]?.equipment
			? {
					equipment: {
						id: historyConstants[0].equipment.id,
						code: historyConstants[0].equipment.code,
						name: historyConstants[0].equipment.name,
						type: historyConstants[0].equipment.type,
					},
					unit: {
						id: historyConstants[0].equipment.unit?.id ?? "",
						code: historyConstants[0].equipment.unit?.code ?? "",
						name: historyConstants[0].equipment.unit?.name ?? "",
					},
					history: historyConstants.map((c) => ({
						id: c.id,
						consumptionRate: c.consumptionRate,
						consumptionUnit: c.consumptionUnit,
						effectiveFrom: c.effectiveFrom,
						effectiveTo: c.effectiveTo,
						notes: c.notes,
						createdAt: c.createdAt,
						createdBy: c.createdByUser,
					})),
				}
			: null;

	// Mutation to update equipment constant
	const updateConstantMutation = useMutation({
		mutationFn: async (params: {
			equipmentId: string;
			consumptionRate: number;
			consumptionUnit: "m3_per_hour" | "m3_per_day";
			effectiveFrom: string;
			notes?: string;
		}) => {
			const response = await api.gas.admin
				.equipment({ equipmentId: params.equipmentId })
				.constant.put({
					consumptionRate: params.consumptionRate,
					consumptionUnit: params.consumptionUnit,
					effectiveFrom: params.effectiveFrom,
					notes: params.notes,
				});
			if (response.error) {
				const errorObj = response.error as { error?: string };
				throw new Error(errorObj.error ?? "Falha ao atualizar constante");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["gas", "admin", "units"] });
			toast.success("Constante atualizada com sucesso");
			handleCloseEditDialog();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Toggle unit expansion
	const toggleUnit = (unitId: string) => {
		setExpandedUnits((prev) => {
			const next = new Set(prev);
			if (next.has(unitId)) {
				next.delete(unitId);
			} else {
				next.add(unitId);
			}
			return next;
		});
	};

	// Open edit dialog
	const handleEdit = (equipment: Equipment) => {
		const currentConstant = equipment.constants.find((c) => !c.effectiveTo);
		setEditEquipment(equipment);
		setNewRate(currentConstant?.consumptionRate.toString() ?? "");
		setNewUnit(
			(currentConstant?.consumptionUnit as "m3_per_hour" | "m3_per_day") ??
				"m3_per_hour",
		);
		setEffectiveDate(getTodayDate());
		setNotes("");
	};

	// Close edit dialog
	const handleCloseEditDialog = () => {
		setEditEquipment(null);
		setNewRate("");
		setNewUnit("m3_per_hour");
		setEffectiveDate(getTodayDate());
		setNotes("");
	};

	// Submit edit
	const handleSubmitEdit = () => {
		if (!editEquipment || !newRate) return;

		updateConstantMutation.mutate({
			equipmentId: editEquipment.id,
			consumptionRate: Number.parseFloat(newRate),
			consumptionUnit: newUnit,
			effectiveFrom: effectiveDate,
			notes: notes || undefined,
		});
	};

	// Open history sheet
	const handleViewHistory = (equipmentId: string) => {
		setHistoryEquipmentId(equipmentId);
	};

	// Close history sheet
	const handleCloseHistory = () => {
		setHistoryEquipmentId(null);
	};

	return (
		<>
			<Header fixed>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/">Home</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/gas">Gas</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Administração</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="ms-auto flex items-center space-x-4">
					<Search />
					<ThemeSwitch />
					<ConfigDrawer />
					<ProfileDropdown />
				</div>
			</Header>

			<Main className="flex flex-1 flex-col gap-4 sm:gap-6">
				<div className="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							Administração de Gás
						</h2>
						<p className="text-muted-foreground">
							Gerencie as constantes de consumo dos equipamentos.
						</p>
					</div>
				</div>

				{/* Units List */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Configuração de Equipamentos
						</CardTitle>
						<CardDescription>
							Visualize e edite as constantes de consumo de cada equipamento.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								<span className="text-muted-foreground ml-2">
									Carregando unidades...
								</span>
							</div>
						) : units && units.length > 0 ? (
							<div className="space-y-4">
								{units.map((unit) => (
									<Card key={unit.id}>
										<CardHeader
											className="cursor-pointer"
											onClick={() => toggleUnit(unit.id)}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													{expandedUnits.has(unit.id) ? (
														<ChevronDown className="h-5 w-5" />
													) : (
														<ChevronRight className="h-5 w-5" />
													)}
													<Factory className="h-5 w-5 text-blue-500" />
													<CardTitle className="text-lg">{unit.name}</CardTitle>
													<Badge variant="outline">{unit.code}</Badge>
												</div>
												<Badge variant={unit.active ? "default" : "secondary"}>
													{unit.active ? "Ativo" : "Inativo"}
												</Badge>
											</div>
										</CardHeader>
										{expandedUnits.has(unit.id) && (
											<CardContent>
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead>Equipamento</TableHead>
															<TableHead>Tipo</TableHead>
															<TableHead className="text-right">
																Taxa de Consumo
															</TableHead>
															<TableHead>Unidade</TableHead>
															<TableHead>Vigência Desde</TableHead>
															<TableHead>Status</TableHead>
															<TableHead className="text-right">Ações</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{unit.equipment.map((equipment) => {
															const currentConstant = equipment.constants.find(
																(c) => !c.effectiveTo,
															);
															return (
																<TableRow key={equipment.id}>
																	<TableCell className="font-medium">
																		{equipment.name}
																		<div className="text-muted-foreground text-xs">
																			{equipment.code}
																		</div>
																	</TableCell>
																	<TableCell>
																		<Badge variant="outline">
																			{getEquipmentTypeLabel(equipment.type)}
																		</Badge>
																	</TableCell>
																	<TableCell className="text-right font-mono">
																		{currentConstant
																			? formatValue(currentConstant.consumptionRate)
																			: "-"}
																	</TableCell>
																	<TableCell>
																		{currentConstant
																			? getConsumptionUnitLabel(
																					currentConstant.consumptionUnit,
																				)
																			: "-"}
																	</TableCell>
																	<TableCell>
																		{currentConstant
																			? formatDate(currentConstant.effectiveFrom)
																			: "-"}
																	</TableCell>
																	<TableCell>
																		<Badge
																			variant={
																				equipment.active ? "success" : "secondary"
																			}
																		>
																			{equipment.active ? "Ativo" : "Inativo"}
																		</Badge>
																	</TableCell>
																	<TableCell className="text-right">
																		<div className="flex justify-end gap-2">
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() => handleEdit(equipment)}
																			>
																				<Edit2 className="h-4 w-4" />
																			</Button>
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() =>
																					handleViewHistory(equipment.id)
																				}
																			>
																				<History className="h-4 w-4" />
																			</Button>
																		</div>
																	</TableCell>
																</TableRow>
															);
														})}
														{unit.equipment.length === 0 && (
															<TableRow>
																<TableCell
																	colSpan={7}
																	className="text-muted-foreground text-center"
																>
																	Nenhum equipamento cadastrado
																</TableCell>
															</TableRow>
														)}
													</TableBody>
												</Table>
											</CardContent>
										)}
									</Card>
								))}
							</div>
						) : (
							<div className="text-muted-foreground py-8 text-center">
								Nenhuma unidade encontrada.
							</div>
						)}
					</CardContent>
				</Card>
			</Main>

			{/* Edit Dialog */}
			<Dialog open={!!editEquipment} onOpenChange={() => handleCloseEditDialog()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Constante de Consumo</DialogTitle>
						<DialogDescription>
							{editEquipment && (
								<>
									Atualize a taxa de consumo do equipamento{" "}
									<strong>{editEquipment.name}</strong> ({editEquipment.code}).
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="rate">Taxa de Consumo *</Label>
							<Input
								id="rate"
								type="number"
								step="0.01"
								min="0"
								value={newRate}
								onChange={(e) => setNewRate(e.target.value)}
								placeholder="Ex: 1500"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="unit">Unidade de Consumo</Label>
							<Select
								value={newUnit}
								onValueChange={(v) =>
									setNewUnit(v as "m3_per_hour" | "m3_per_day")
								}
							>
								<SelectTrigger id="unit">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="m3_per_hour">m³/h (metros cúbicos por hora)</SelectItem>
									<SelectItem value="m3_per_day">m³/dia (metros cúbicos por dia)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="effectiveDate">Data de Vigência *</Label>
							<Input
								id="effectiveDate"
								type="date"
								value={effectiveDate}
								onChange={(e) => setEffectiveDate(e.target.value)}
							/>
							<p className="text-muted-foreground text-xs">
								A nova constante será aplicada a partir desta data.
							</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="notes">Observações</Label>
							<Textarea
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Ex: Recalibragem do equipamento"
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={handleCloseEditDialog}>
							Cancelar
						</Button>
						<Button
							onClick={handleSubmitEdit}
							disabled={!newRate || !effectiveDate || updateConstantMutation.isPending}
						>
							{updateConstantMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Salvar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* History Sheet */}
			<Sheet open={!!historyEquipmentId} onOpenChange={() => handleCloseHistory()}>
				<SheetContent className="w-full sm:max-w-lg">
					<SheetHeader>
						<SheetTitle>Histórico de Constantes</SheetTitle>
						<SheetDescription>
							{historyData && (
								<>
									Equipamento: <strong>{historyData.equipment.name}</strong> (
									{historyData.equipment.code}) - {historyData.unit.name}
								</>
							)}
						</SheetDescription>
					</SheetHeader>
					<div className="mt-6">
						{isLoadingHistory ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : historyData && historyData.history.length > 0 ? (
							<div className="space-y-4">
								{historyData.history.map((entry, index) => (
									<Card
										key={entry.id}
										className={index === 0 ? "border-green-500/50" : ""}
									>
										<CardContent className="pt-4">
											<div className="flex items-start justify-between">
												<div>
													<p className="font-mono text-lg font-semibold">
														{formatValue(entry.consumptionRate)}{" "}
														{getConsumptionUnitLabel(entry.consumptionUnit)}
													</p>
													<p className="text-muted-foreground text-sm">
														Vigência: {formatDate(entry.effectiveFrom)}
														{entry.effectiveTo && (
															<> até {formatDate(entry.effectiveTo)}</>
														)}
													</p>
													{entry.notes && (
														<p className="text-muted-foreground mt-1 text-sm italic">
															"{entry.notes}"
														</p>
													)}
												</div>
												{index === 0 && !entry.effectiveTo && (
													<Badge variant="success">Atual</Badge>
												)}
											</div>
											<div className="text-muted-foreground mt-2 text-xs">
												Alterado em {formatDateTime(entry.createdAt)}
												{entry.createdBy && (
													<> por {entry.createdBy.name}</>
												)}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-muted-foreground py-8 text-center">
								Nenhum histórico encontrado.
							</div>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
