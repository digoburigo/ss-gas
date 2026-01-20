import { Button } from "@acme/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { useMemo } from "react";
import * as z from "zod";

import { DatePicker } from "~/components/date-picker";

/**
 * Equipment types matching server-side enum
 */
type EquipmentType = "atomizer" | "line" | "dryer" | "other";
type LineStatusValue = "on" | "off";
type ConsumptionUnit = "m3_per_hour" | "m3_per_day";

/**
 * Equipment with its current consumption constant
 */
interface Equipment {
	id: string;
	code: string;
	name: string;
	type: EquipmentType;
	orderIndex: number;
	currentConstant?: {
		consumptionRate: number;
		consumptionUnit: ConsumptionUnit;
	};
}

/**
 * Unit data needed for rendering the form
 */
interface Unit {
	id: string;
	code: string;
	name: string;
	equipment: Equipment[];
}

/**
 * Form data structure
 */
interface DailyEntryFormData {
	date: Date;
	atomizerScheduled: boolean;
	atomizerHours: number;
	secondaryAtomizerScheduled: boolean;
	secondaryAtomizerHours: number;
	lineStatuses: Record<string, LineStatusValue>;
	observations: string;
	qdsManualOverride: boolean;
	qdsManualValue: number;
}

interface DailyEntryFormProps {
	unit: Unit;
	defaultValues?: Partial<DailyEntryFormData>;
	onSubmit: (data: DailyEntryFormData) => Promise<void>;
	isSubmitting?: boolean;
}

/**
 * Normalize consumption rate to hourly rate (m³/h)
 * Mirrors server-side logic in gas.service.ts
 */
function normalizeToHourlyRate(
	rate: number,
	unit: ConsumptionUnit,
): number {
	if (unit === "m3_per_day") {
		return rate / 24;
	}
	return rate;
}

/**
 * Calculate QDC for atomizer(s)
 * Mirrors GasCalculationService.calculateQdcAtomizer
 */
function calculateQdcAtomizer(
	primaryAtomizer: {
		scheduled: boolean;
		hours: number;
		consumptionRate: number;
		consumptionUnit: ConsumptionUnit;
	} | null,
	secondaryAtomizer?: {
		scheduled: boolean;
		hours: number;
		consumptionRate: number;
		consumptionUnit: ConsumptionUnit;
	} | null,
): number {
	let total = 0;

	if (primaryAtomizer?.scheduled && primaryAtomizer.hours > 0) {
		const rate = normalizeToHourlyRate(
			primaryAtomizer.consumptionRate,
			primaryAtomizer.consumptionUnit,
		);
		total += rate * primaryAtomizer.hours;
	}

	if (secondaryAtomizer?.scheduled && secondaryAtomizer.hours > 0) {
		const rate = normalizeToHourlyRate(
			secondaryAtomizer.consumptionRate,
			secondaryAtomizer.consumptionUnit,
		);
		total += rate * secondaryAtomizer.hours;
	}

	return Math.round(total * 100) / 100;
}

/**
 * Calculate QDC for production lines
 * Mirrors GasCalculationService.calculateQdcLines
 */
function calculateQdcLines(
	lines: Array<{
		status: LineStatusValue;
		consumptionRate: number;
		consumptionUnit: ConsumptionUnit;
	}>,
): number {
	const total = lines
		.filter((line) => line.status === "on")
		.reduce((sum, line) => {
			const rate = normalizeToHourlyRate(
				line.consumptionRate,
				line.consumptionUnit,
			);
			return sum + rate * 24;
		}, 0);

	return Math.round(total * 100) / 100;
}

/**
 * Format number for display with thousands separator
 */
function formatNumber(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function DailyEntryForm({
	unit,
	defaultValues,
	onSubmit,
	isSubmitting = false,
}: DailyEntryFormProps) {
	// Extract atomizers and lines from unit equipment
	const atomizers = useMemo(
		() => unit.equipment.filter((e) => e.type === "atomizer"),
		[unit.equipment],
	);
	const lines = useMemo(
		() =>
			unit.equipment
				.filter((e) => e.type === "line")
				.sort((a, b) => a.orderIndex - b.orderIndex),
		[unit.equipment],
	);

	const primaryAtomizer = atomizers[0];
	const secondaryAtomizer = atomizers[1];

	// Check if this is Botucatu (has secondary atomizer)
	const hasSecondaryAtomizer = Boolean(secondaryAtomizer);

	// Initialize line statuses default values
	const initialLineStatuses: Record<string, LineStatusValue> = {};
	for (const line of lines) {
		initialLineStatuses[line.id] =
			defaultValues?.lineStatuses?.[line.id] ?? "off";
	}

	const form = useForm({
		defaultValues: {
			date: defaultValues?.date ?? new Date(),
			atomizerScheduled: defaultValues?.atomizerScheduled ?? true,
			atomizerHours: defaultValues?.atomizerHours ?? 0,
			secondaryAtomizerScheduled:
				defaultValues?.secondaryAtomizerScheduled ?? false,
			secondaryAtomizerHours: defaultValues?.secondaryAtomizerHours ?? 0,
			lineStatuses: initialLineStatuses,
			observations: defaultValues?.observations ?? "",
			qdsManualOverride: defaultValues?.qdsManualOverride ?? false,
			qdsManualValue: defaultValues?.qdsManualValue ?? 0,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
		validators: {
			onSubmit: z.object({
				date: z.date({ message: "Data é obrigatória" }),
				atomizerScheduled: z.boolean(),
				atomizerHours: z
					.number()
					.min(0, "Horas devem ser entre 0 e 24")
					.max(24, "Horas devem ser entre 0 e 24"),
				secondaryAtomizerScheduled: z.boolean(),
				secondaryAtomizerHours: z
					.number()
					.min(0, "Horas devem ser entre 0 e 24")
					.max(24, "Horas devem ser entre 0 e 24"),
				lineStatuses: z.record(z.string(), z.enum(["on", "off"])),
				observations: z.string(),
				qdsManualOverride: z.boolean(),
				qdsManualValue: z.number().min(0, "Valor deve ser positivo"),
			}),
		},
	});

	return (
		<form
			className="space-y-6"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			{/* Date Selection */}
			<Card>
				<CardHeader>
					<CardTitle>Data do Lançamento</CardTitle>
					<CardDescription>
						Selecione a data para o registro diário de consumo
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form.Field name="date">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Data *</Label>
								<DatePicker
									selected={field.state.value}
									onSelect={(date) => field.handleChange(date ?? new Date())}
									placeholder="Selecione a data"
								/>
								{field.state.meta.errors.map((error) => (
									<p
										className="text-destructive text-sm"
										key={error?.message}
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</CardContent>
			</Card>

			{/* Atomizer Section */}
			{primaryAtomizer && (
				<Card>
					<CardHeader>
						<CardTitle>Atomizador</CardTitle>
						<CardDescription>
							Configure o funcionamento do atomizador para o dia
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Primary Atomizer */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">{primaryAtomizer.name}</p>
									<p className="text-muted-foreground text-sm">
										{primaryAtomizer.code} -{" "}
										{formatNumber(
											primaryAtomizer.currentConstant?.consumptionRate ?? 0,
										)}{" "}
										m³/h
									</p>
								</div>
								<form.Field name="atomizerScheduled">
									{(field) => (
										<div className="flex items-center gap-2">
											<Label htmlFor="atomizerScheduled">Programado</Label>
											<Switch
												id="atomizerScheduled"
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(checked)
												}
											/>
										</div>
									)}
								</form.Field>
							</div>

							<form.Field name="atomizerHours">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Horas de Funcionamento *</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											min={0}
											max={24}
											step={0.5}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value ? Number(e.target.value) : 0,
												)
											}
											value={field.state.value}
											className={`w-32 ${field.state.meta.errors.length > 0 ? "border-destructive" : ""}`}
										/>
										{field.state.meta.errors.map((error) => (
											<p
												className="text-destructive text-sm"
												key={error?.message}
											>
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>
						</div>

						{/* Secondary Atomizer (only for Botucatu) */}
						{hasSecondaryAtomizer && secondaryAtomizer && (
							<>
								<div className="border-t pt-4" />
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium">{secondaryAtomizer.name}</p>
											<p className="text-muted-foreground text-sm">
												{secondaryAtomizer.code} -{" "}
												{formatNumber(
													secondaryAtomizer.currentConstant?.consumptionRate ??
														0,
												)}{" "}
												m³/h
											</p>
										</div>
										<form.Field name="secondaryAtomizerScheduled">
											{(field) => (
												<div className="flex items-center gap-2">
													<Label htmlFor="secondaryAtomizerScheduled">
														Programado
													</Label>
													<Switch
														id="secondaryAtomizerScheduled"
														checked={field.state.value}
														onCheckedChange={(checked) =>
															field.handleChange(checked)
														}
													/>
												</div>
											)}
										</form.Field>
									</div>

									<form.Field name="secondaryAtomizerHours">
										{(field) => (
											<div className="space-y-2">
												<Label htmlFor={field.name}>
													Horas de Funcionamento *
												</Label>
												<Input
													id={field.name}
													name={field.name}
													type="number"
													min={0}
													max={24}
													step={0.5}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(
															e.target.value ? Number(e.target.value) : 0,
														)
													}
													value={field.state.value}
													className={`w-32 ${field.state.meta.errors.length > 0 ? "border-destructive" : ""}`}
												/>
												{field.state.meta.errors.map((error) => (
													<p
														className="text-destructive text-sm"
														key={error?.message}
													>
														{error?.message}
													</p>
												))}
											</div>
										)}
									</form.Field>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			)}

			{/* Production Lines Section */}
			{lines.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Linhas de Produção</CardTitle>
						<CardDescription>
							Indique quais linhas estarão ligadas no dia
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form.Field name="lineStatuses">
							{(field) => (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{lines.map((line) => {
										const status = field.state.value[line.id] ?? "off";
										return (
											<div
												key={line.id}
												className="flex items-center justify-between rounded-lg border p-3"
											>
												<div>
													<p className="font-medium">{line.name}</p>
													<p className="text-muted-foreground text-xs">
														{formatNumber(
															line.currentConstant?.consumptionRate ?? 0,
														)}{" "}
														m³/h
													</p>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground text-sm">
														{status === "on" ? "Ligada" : "Desligada"}
													</span>
													<Switch
														checked={status === "on"}
														onCheckedChange={(checked) => {
															const newStatuses = {
																...field.state.value,
																[line.id]: checked ? "on" : "off",
															} as Record<string, LineStatusValue>;
															field.handleChange(newStatuses);
														}}
													/>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</form.Field>
					</CardContent>
				</Card>
			)}

			{/* Observations */}
			<Card>
				<CardHeader>
					<CardTitle>Observações</CardTitle>
					<CardDescription>
						Adicione observações relevantes sobre o dia (opcional)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form.Field name="observations">
						{(field) => (
							<div className="space-y-2">
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="Ex: Manutenção programada, parada técnica..."
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									value={field.state.value}
									rows={3}
								/>
							</div>
						)}
					</form.Field>
				</CardContent>
			</Card>

			{/* QDS Calculation Preview */}
			<form.Subscribe selector={(state) => state.values}>
				{(values) => {
					// Calculate QDC for atomizer
					const primaryAtomizerInput = primaryAtomizer?.currentConstant
						? {
								scheduled: values.atomizerScheduled,
								hours: values.atomizerHours,
								consumptionRate:
									primaryAtomizer.currentConstant.consumptionRate,
								consumptionUnit:
									primaryAtomizer.currentConstant.consumptionUnit,
							}
						: null;

					const secondaryAtomizerInput =
						secondaryAtomizer?.currentConstant && hasSecondaryAtomizer
							? {
									scheduled: values.secondaryAtomizerScheduled,
									hours: values.secondaryAtomizerHours,
									consumptionRate:
										secondaryAtomizer.currentConstant.consumptionRate,
									consumptionUnit:
										secondaryAtomizer.currentConstant.consumptionUnit,
								}
							: null;

					const qdcAtomizer = calculateQdcAtomizer(
						primaryAtomizerInput,
						secondaryAtomizerInput,
					);

					// Calculate QDC for lines
					const linesWithStatus = lines.map((line) => ({
						status: values.lineStatuses[line.id] ?? "off",
						consumptionRate: line.currentConstant?.consumptionRate ?? 0,
						consumptionUnit:
							line.currentConstant?.consumptionUnit ?? "m3_per_hour",
					}));

					const qdcLines = calculateQdcLines(linesWithStatus);

					// Total QDS (calculated)
					const qdsCalculated =
						Math.round((qdcAtomizer + qdcLines) * 100) / 100;

					// Final QDS value (manual override or calculated)
					const qdsFinal = values.qdsManualOverride
						? values.qdsManualValue
						: qdsCalculated;

					return (
						<Card className="border-primary/20 bg-primary/5">
							<CardHeader>
								<CardTitle>Consumo Calculado (QDS)</CardTitle>
								<CardDescription>
									Previsão de consumo diário baseado nas configurações acima
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid gap-4 sm:grid-cols-3">
									<div className="text-center">
										<p className="text-muted-foreground text-sm">
											Atomizador(es)
										</p>
										<p className="text-2xl font-bold">
											{formatNumber(qdcAtomizer)}
										</p>
										<p className="text-muted-foreground text-xs">m³/dia</p>
									</div>
									<div className="text-center">
										<p className="text-muted-foreground text-sm">Linhas</p>
										<p className="text-2xl font-bold">
											{formatNumber(qdcLines)}
										</p>
										<p className="text-muted-foreground text-xs">m³/dia</p>
									</div>
									<div
										className={`rounded-lg p-3 text-center ${
											values.qdsManualOverride
												? "border-2 border-amber-500/50 bg-amber-500/10"
												: "bg-primary/10"
										}`}
									>
										<p className="text-muted-foreground text-sm">
											Total QDS
											{values.qdsManualOverride && " (Manual)"}
										</p>
										<p
											className={`text-3xl font-bold ${
												values.qdsManualOverride
													? "text-amber-600"
													: "text-primary"
											}`}
										>
											{formatNumber(qdsFinal)}
										</p>
										<p className="text-muted-foreground text-xs">m³/dia</p>
									</div>
								</div>

								{/* Manual Override Option */}
								<div className="border-t pt-4">
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-center gap-3">
											<form.Field name="qdsManualOverride">
												{(field) => (
													<Switch
														id="qdsManualOverride"
														checked={field.state.value}
														onCheckedChange={(checked) =>
															field.handleChange(checked)
														}
													/>
												)}
											</form.Field>
											<div>
												<Label
													htmlFor="qdsManualOverride"
													className="cursor-pointer"
												>
													Sobrescrever valor calculado
												</Label>
												<p className="text-muted-foreground text-xs">
													Use quando o cálculo automático não refletir a
													realidade
												</p>
											</div>
										</div>

										{values.qdsManualOverride && (
											<form.Field name="qdsManualValue">
												{(field) => (
													<div className="space-y-1">
														<Input
															id={field.name}
															name={field.name}
															type="number"
															min={0}
															step={0.01}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(
																	e.target.value ? Number(e.target.value) : 0,
																)
															}
															value={field.state.value}
															className={`w-40 ${field.state.meta.errors.length > 0 ? "border-destructive" : ""}`}
															placeholder="Valor manual (m³/dia)"
														/>
														{field.state.meta.errors.map((error) => (
															<p
																className="text-destructive text-sm"
																key={error?.message}
															>
																{error?.message}
															</p>
														))}
													</div>
												)}
											</form.Field>
										)}
									</div>

									{values.qdsManualOverride && (
										<p className="text-muted-foreground mt-2 text-xs">
											Valor calculado original: {formatNumber(qdsCalculated)}{" "}
											m³/dia
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					);
				}}
			</form.Subscribe>

			{/* Submit Button */}
			<form.Subscribe>
				{(state) => (
					<div className="flex justify-end gap-2">
						<Button
							disabled={!state.canSubmit || state.isSubmitting || isSubmitting}
							type="submit"
							size="lg"
						>
							{state.isSubmitting || isSubmitting
								? "Salvando..."
								: "Salvar Lançamento"}
						</Button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
}
