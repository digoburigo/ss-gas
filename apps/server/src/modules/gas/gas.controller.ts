import { sendEmail } from "@acme/email";
import { DeviationAlertEmail } from "@acme/email/emails";
import { authDb, db } from "@acme/zen-v3";
import { Elysia, t } from "elysia";
import ExcelJS from "exceljs";

import { betterAuth } from "../../plugins/better-auth";
import { AuditService, ContractAlertService } from "../../services";
import { GasCalculationService } from "./gas.service";

const APP_URL = process.env.PUBLIC_WEB_URL ?? "http://localhost:3001";

/**
 * Line status value type matching ZenStack enum
 */
type LineStatusValue = "on" | "off";

/**
 * Equipment type matching ZenStack enum
 */
type EquipmentType = "atomizer" | "line" | "dryer" | "other";

/**
 * Consumption unit type matching ZenStack enum
 */
type ConsumptionUnit = "m3_per_hour" | "m3_per_day";

/**
 * Schema for line status input in POST request
 */
const LineStatusInputSchema = t.Object({
	equipmentId: t.String(),
	status: t.Union([t.Literal("on"), t.Literal("off")]),
});

/**
 * Schema for creating a daily entry
 */
const CreateEntrySchema = t.Object({
	date: t.String({ format: "date" }),
	atomizerScheduled: t.Optional(t.Boolean()),
	atomizerHours: t.Optional(t.Number({ minimum: 0, maximum: 24 })),
	secondaryAtomizerScheduled: t.Optional(t.Boolean()),
	secondaryAtomizerHours: t.Optional(t.Number({ minimum: 0, maximum: 24 })),
	qdsManual: t.Optional(t.Number()),
	observations: t.Optional(t.String()),
	lineStatuses: t.Optional(t.Array(LineStatusInputSchema)),
});

export const gasController = new Elysia({ prefix: "/gas" })
	.use(betterAuth)
	.get("/", () => ({ message: "Gas module" }))

	/**
	 * GET /gas/consumer-units/:unitId/can-delete
	 *
	 * Checks if a consumer unit can be deleted.
	 * A unit cannot be deleted if it has pending schedules (daily plans not yet submitted).
	 */
	.get(
		"/consumer-units/:unitId/can-delete",
		async ({ params, session, status }) => {
			const { unitId } = params;

			// Verify unit exists and belongs to user's organization
			const unit = await db.gasUnit.findUnique({
				where: { id: unitId },
			});

			if (!unit) {
				return status(404, { error: "Unit not found" });
			}

			if (unit.organizationId !== session.activeOrganizationId) {
				return status(403, { error: "Access denied" });
			}

			// Check for pending schedules (daily plans that are not yet submitted or future dates)
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const pendingSchedules = await db.gasDailyPlan.count({
				where: {
					unitId,
					OR: [
						// Plans that haven't been submitted yet
						{ submitted: false },
						// Future plans
						{ date: { gte: today } },
					],
				},
			});

			// Check for daily entries in the current month or future
			const firstDayOfMonth = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const pendingEntries = await db.gasDailyEntry.count({
				where: {
					unitId,
					date: { gte: firstDayOfMonth },
				},
			});

			const hasPendingSchedules = pendingSchedules > 0;
			const hasPendingEntries = pendingEntries > 0;

			if (hasPendingSchedules || hasPendingEntries) {
				return {
					canDelete: false,
					reason: hasPendingSchedules
						? `Esta unidade possui ${pendingSchedules} agendamento(s) pendente(s) ou futuro(s). Cancele ou conclua os agendamentos antes de excluir.`
						: `Esta unidade possui ${pendingEntries} lançamento(s) no mês atual. Aguarde a virada do mês ou exclua os lançamentos manualmente.`,
					pendingSchedules,
					pendingEntries,
				};
			}

			return {
				canDelete: true,
				reason: null,
				pendingSchedules: 0,
				pendingEntries: 0,
			};
		},
		{
			auth: true,
			params: t.Object({
				unitId: t.String(),
			}),
			response: {
				200: t.Object({
					canDelete: t.Boolean(),
					reason: t.Nullable(t.String()),
					pendingSchedules: t.Number(),
					pendingEntries: t.Number(),
				}),
				403: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/units
	 *
	 * Returns all units for the current organization with their equipment.
	 * Used by the daily entry page to select a unit and display its equipment.
	 */
	.get(
		"/units",
		async ({ session }) => {
			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				include: {
					equipment: {
						where: { active: true },
						orderBy: { orderIndex: "asc" },
						include: {
							constants: {
								where: {
									effectiveTo: null,
								},
								orderBy: { effectiveFrom: "desc" },
								take: 1,
							},
						},
					},
				},
				orderBy: { code: "asc" },
			});

			// Transform to include currentConstant in equipment
			const transformedUnits = units.map((unit) => ({
				...unit,
				equipment: unit.equipment.map((eq) => {
					const constant = eq.constants[0];
					return {
						id: eq.id,
						code: eq.code,
						name: eq.name,
						type: eq.type,
						orderIndex: eq.orderIndex,
						currentConstant: constant
							? {
									id: constant.id,
									consumptionRate: constant.consumptionRate,
									consumptionUnit: constant.consumptionUnit,
									effectiveFrom: constant.effectiveFrom,
								}
							: null,
					};
				}),
			}));

			return { units: transformedUnits };
		},
		{
			auth: true,
			response: {
				200: t.Object({
					units: t.Array(
						t.Object({
							id: t.String(),
							code: t.String(),
							name: t.String(),
							equipment: t.Array(
								t.Object({
									id: t.String(),
									code: t.String(),
									name: t.String(),
									type: t.Union([
										t.Literal("atomizer"),
										t.Literal("line"),
										t.Literal("dryer"),
										t.Literal("other"),
									]),
									orderIndex: t.Number(),
									currentConstant: t.Nullable(
										t.Object({
											id: t.String(),
											consumptionRate: t.Number(),
											consumptionUnit: t.Union([
												t.Literal("m3_per_hour"),
												t.Literal("m3_per_day"),
											]),
											effectiveFrom: t.Date(),
										}),
									),
								}),
							),
						}),
					),
				}),
			},
		},
	)

	/**
	 * POST /gas/units/:unitId/entries
	 *
	 * Creates a new daily entry for a unit with validation and auto-calculation.
	 * Validates:
	 * - Hours are between 0-24
	 * - Equipment IDs belong to the unit
	 * Auto-calculates:
	 * - qdcAtomizer: atomizer consumption based on scheduled hours
	 * - qdcLines: sum of consumption for lines with ON status
	 * - qdsCalculated: total of atomizer + lines
	 */
	.post(
		"/units/:unitId/entries",
		async ({ params, body, user, session, status }) => {
			const { unitId } = params;

			// Set up authenticated database client
			const userDb = authDb.$setAuth({
				userId: user.id,
				organizationId: session.activeOrganizationId ?? "",
				organizationRole: "member",
				role: "user",
			});

			// Verify unit exists
			const unit = await db.gasUnit.findUnique({
				where: { id: unitId },
			});

			if (!unit) {
				return status(404, { error: "Unit not found" });
			}

			// Parse date - append T00:00:00.000Z to ensure UTC midnight
			const entryDate = new Date(`${body.date}T00:00:00.000Z`);

			// Check if entry already exists for this unit and date (for upsert)
			const existingEntry = await db.gasDailyEntry.findFirst({
				where: {
					unitId,
					date: entryDate,
				},
			});

			// Get unit equipment with current constants
			const equipment = await db.gasEquipment.findMany({
				where: { unitId, active: true },
				include: {
					constants: {
						where: {
							effectiveTo: null,
						},
						orderBy: { effectiveFrom: "desc" },
						take: 1,
					},
				},
				orderBy: { orderIndex: "asc" },
			});

			// Validate line statuses - ensure all equipment IDs belong to the unit
			const lineStatuses = body.lineStatuses ?? [];
			const equipmentIds = new Set(equipment.map((e) => e.id));

			for (const lineStatus of lineStatuses) {
				if (!equipmentIds.has(lineStatus.equipmentId)) {
					return status(400, {
						error: `Invalid equipment ID: ${lineStatus.equipmentId}`,
					});
				}
			}

			// Find atomizers (primary and secondary)
			const atomizers = equipment.filter(
				(e) => (e.type as EquipmentType) === "atomizer",
			);
			const primaryAtomizer = atomizers[0];
			const secondaryAtomizer = atomizers[1];

			// Calculate QDC for atomizer(s)
			let qdcAtomizer = 0;
			if (primaryAtomizer) {
				const primaryConstant = primaryAtomizer.constants[0];
				const primaryInput = {
					scheduled: body.atomizerScheduled ?? true,
					hours: body.atomizerHours ?? 0,
					consumptionRate: primaryConstant?.consumptionRate ?? 0,
					consumptionUnit:
						(primaryConstant?.consumptionUnit as ConsumptionUnit) ??
						"m3_per_hour",
				};

				let secondaryInput;
				if (secondaryAtomizer) {
					const secondaryConstant = secondaryAtomizer.constants[0];
					secondaryInput = {
						scheduled: body.secondaryAtomizerScheduled ?? false,
						hours: body.secondaryAtomizerHours ?? 0,
						consumptionRate: secondaryConstant?.consumptionRate ?? 0,
						consumptionUnit:
							(secondaryConstant?.consumptionUnit as ConsumptionUnit) ??
							"m3_per_hour",
					};
				}

				qdcAtomizer = GasCalculationService.calculateQdcAtomizer(
					primaryInput,
					secondaryInput,
				);
			}

			// Build line status map from input
			const lineStatusMap = new Map<string, LineStatusValue>();
			for (const ls of lineStatuses) {
				lineStatusMap.set(ls.equipmentId, ls.status as LineStatusValue);
			}

			// Calculate QDC for lines (only lines, not atomizers or dryers)
			const lines = equipment.filter(
				(e) => (e.type as EquipmentType) === "line",
			);
			const linesWithStatus = lines.map((line) => {
				const constant = line.constants[0];
				return {
					equipmentId: line.id,
					status: lineStatusMap.get(line.id) ?? ("off" as LineStatusValue),
					consumptionRate: constant?.consumptionRate ?? 0,
					consumptionUnit:
						(constant?.consumptionUnit as ConsumptionUnit) ?? "m3_per_hour",
				};
			});

			const qdcLines = GasCalculationService.calculateQdcLines(linesWithStatus);

			// Calculate total QDS
			const qdsCalculated = GasCalculationService.calculateQds(
				qdcAtomizer,
				qdcLines,
			);

			// Upsert the entry: update if exists, create if not
			const entryData = {
				atomizerScheduled: body.atomizerScheduled ?? true,
				atomizerHours: body.atomizerHours ?? 0,
				secondaryAtomizerScheduled: body.secondaryAtomizerScheduled,
				secondaryAtomizerHours: body.secondaryAtomizerHours,
				qdcAtomizer,
				qdcLines,
				qdsCalculated,
				qdsManual: body.qdsManual,
				observations: body.observations,
			};

			let entry;
			if (existingEntry) {
				entry = await db.gasDailyEntry.update({
					where: { id: existingEntry.id },
					data: entryData,
				});

				// Delete existing line statuses before re-creating
				await db.gasLineStatus.deleteMany({
					where: { entryId: existingEntry.id },
				});
			} else {
				entry = await userDb.gasDailyEntry.create({
					data: {
						unitId,
						date: entryDate,
						...entryData,
					},
				});
			}

			// Create line statuses for all lines
			const lineStatusRecords = [];
			for (const line of lines) {
				const lineStatusRecord = await db.gasLineStatus.create({
					data: {
						entryId: entry.id,
						equipmentId: line.id,
						status: lineStatusMap.get(line.id) ?? "off",
					},
				});
				lineStatusRecords.push(lineStatusRecord);
			}

			// Auto-derive QDP from equipment statuses and persist in GasDailyPlan
			const qdpEquipment = equipment.map((eq) => {
				const constant = eq.constants[0];
				const eqType = eq.type as EquipmentType;
				let eqStatus: "on" | "off" = "off";
				let plannedHours = 0;

				if (eqType === "atomizer") {
					// Primary atomizer
					if (eq.id === primaryAtomizer?.id) {
						eqStatus = (body.atomizerScheduled ?? true) ? "on" : "off";
						plannedHours = body.atomizerHours ?? 0;
					}
					// Secondary atomizer
					else if (eq.id === secondaryAtomizer?.id) {
						eqStatus =
							(body.secondaryAtomizerScheduled ?? false) ? "on" : "off";
						plannedHours = body.secondaryAtomizerHours ?? 0;
					}
				} else if (eqType === "line") {
					eqStatus = lineStatusMap.get(eq.id) ?? "off";
					plannedHours = 24; // Lines run 24h when ON
				} else {
					// dryer/other: include in QDP if they have a line status entry
					eqStatus = lineStatusMap.get(eq.id) ?? "off";
					plannedHours = 24;
				}

				return {
					status: eqStatus,
					consumptionRate: constant?.consumptionRate ?? 0,
					consumptionUnit:
						(constant?.consumptionUnit as ConsumptionUnit) ?? "m3_per_hour",
					plannedHours,
				};
			});

			const qdpValue =
				body.qdsManual ?? GasCalculationService.calculateQdp(qdpEquipment);

			// Upsert GasDailyPlan to persist QDP without manual input
			const existingPlan = await db.gasDailyPlan.findFirst({
				where: { unitId, date: entryDate },
			});

			if (existingPlan) {
				await db.gasDailyPlan.update({
					where: { id: existingPlan.id },
					data: { qdpValue },
				});
			} else {
				await userDb.gasDailyPlan.create({
					data: {
						unitId,
						date: entryDate,
						qdpValue,
					},
				});
			}

			// Audit log: entry created or updated
			AuditService.log({
				entityType: "consumption",
				entityId: entry.id,
				entityName: `${unit.name} - ${body.date}`,
				action: existingEntry ? "update" : "create",
				changes: existingEntry
					? AuditService.computeChanges(
							existingEntry as unknown as Record<string, unknown>,
							entry as unknown as Record<string, unknown>,
							["atomizerHours", "qdcAtomizer", "qdcLines", "qdsCalculated", "qdsManual", "observations"],
						) ?? undefined
					: undefined,
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				organizationId: session.activeOrganizationId ?? undefined,
			});

			// Return entry with line statuses and derived QDP
			return {
				...entry,
				lineStatuses: lineStatusRecords,
			};
		},
		{
			auth: true,
			params: t.Object({
				unitId: t.String(),
			}),
			body: CreateEntrySchema,
			response: {
				200: t.Object({
					id: t.String(),
					unitId: t.String(),
					date: t.Date(),
					atomizerScheduled: t.Boolean(),
					atomizerHours: t.Number(),
					secondaryAtomizerScheduled: t.Nullable(t.Boolean()),
					secondaryAtomizerHours: t.Nullable(t.Number()),
					qdcAtomizer: t.Number(),
					qdcLines: t.Number(),
					qdsCalculated: t.Number(),
					qdsManual: t.Nullable(t.Number()),
					observations: t.Nullable(t.String()),
					createdAt: t.Date(),
					createdById: t.Nullable(t.String()),
					updatedAt: t.Date(),
					updatedById: t.Nullable(t.String()),
					lineStatuses: t.Array(
						t.Object({
							id: t.String(),
							entryId: t.String(),
							equipmentId: t.String(),
							status: t.String(),
							createdAt: t.Date(),
						}),
					),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/units/:unitId/entries
	 *
	 * Returns daily entries for a unit within a specific month.
	 * Query parameter:
	 * - month: YYYY-MM format (required)
	 *
	 * Returns entries with line statuses and equipment info populated.
	 */
	.get(
		"/units/:unitId/entries",
		async ({ params, query, status }) => {
			const { unitId } = params;
			const { month } = query;

			// Validate month format
			const monthRegex = /^\d{4}-\d{2}$/;
			if (!monthRegex.test(month)) {
				return status(400, {
					error: "Invalid month format. Expected YYYY-MM",
				});
			}

			// Verify unit exists
			const unit = await db.gasUnit.findUnique({
				where: { id: unitId },
			});

			if (!unit) {
				return status(404, { error: "Unit not found" });
			}

			// Parse month to get start and end dates
			const parts = month.split("-").map(Number);
			const year = parts[0] ?? 0;
			const monthNum = parts[1] ?? 1;
			const startDate = new Date(year, monthNum - 1, 1);
			const endDate = new Date(year, monthNum, 0); // Last day of month

			// Get entries for the month with line statuses
			const entries = await db.gasDailyEntry.findMany({
				where: {
					unitId,
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				include: {
					lineStatuses: {
						include: {
							equipment: true,
						},
					},
				},
				orderBy: { date: "asc" },
			});

			return entries;
		},
		{
			auth: true,
			params: t.Object({
				unitId: t.String(),
			}),
			query: t.Object({
				month: t.String(),
			}),
			response: {
				200: t.Array(
					t.Object({
						id: t.String(),
						unitId: t.String(),
						date: t.Date(),
						atomizerScheduled: t.Boolean(),
						atomizerHours: t.Number(),
						secondaryAtomizerScheduled: t.Nullable(t.Boolean()),
						secondaryAtomizerHours: t.Nullable(t.Number()),
						qdcAtomizer: t.Number(),
						qdcLines: t.Number(),
						qdsCalculated: t.Number(),
						qdsManual: t.Nullable(t.Number()),
						observations: t.Nullable(t.String()),
						createdAt: t.Date(),
						createdById: t.Nullable(t.String()),
						updatedAt: t.Date(),
						updatedById: t.Nullable(t.String()),
						lineStatuses: t.Array(
							t.Object({
								id: t.String(),
								entryId: t.String(),
								equipmentId: t.String(),
								status: t.String(),
								createdAt: t.Date(),
								equipment: t.Object({
									id: t.String(),
									unitId: t.String(),
									code: t.String(),
									name: t.String(),
									type: t.String(),
									active: t.Boolean(),
									orderIndex: t.Number(),
									createdAt: t.Date(),
									updatedAt: t.Date(),
								}),
							}),
						),
					}),
				),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/consolidated
	 *
	 * Returns consolidated gas data across all units for a specific month.
	 * Query parameter:
	 * - month: YYYY-MM format (required)
	 *
	 * Returns:
	 * - Daily summary with QDC, QDS, QDP, QDR totals across all units
	 * - Status (OK/NOK) for each day based on tolerance bands
	 * - Tolerance band status per day (transport and molecule)
	 * - Unit breakdown available for each day
	 */
	.get(
		"/consolidated",
		async ({ query, status, session }) => {
			const { month } = query;

			// Validate month format
			const monthRegex = /^\d{4}-\d{2}$/;
			if (!monthRegex.test(month)) {
				return status(400, {
					error: "Invalid month format. Expected YYYY-MM",
				});
			}

			// Parse month to get start and end dates
			const parts = month.split("-").map(Number);
			const year = parts[0] ?? 0;
			const monthNum = parts[1] ?? 1;
			const startDate = new Date(year, monthNum - 1, 1);
			const endDate = new Date(year, monthNum, 0); // Last day of month

			// Get all units for the organization
			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				orderBy: { code: "asc" },
			});

			// Get active contract for tolerance calculations
			// If contractId is specified, use that contract directly
			// Otherwise, find the most recent active contract for the organization
			const contract = query.contractId
				? await db.gasContract.findFirst({
						where: {
							id: query.contractId,
							organizationId: session.activeOrganizationId ?? undefined,
						},
					})
				: await db.gasContract.findFirst({
						where: {
							organizationId: session.activeOrganizationId ?? undefined,
							active: true,
							effectiveFrom: { lte: endDate },
							OR: [
								{ effectiveTo: null },
								{ effectiveTo: { gte: startDate } },
							],
						},
						orderBy: { effectiveFrom: "desc" },
					});

			if (!contract) {
				return status(404, { error: "No active contract found" });
			}

			// Get all contracts for this organization (for frontend contract selector)
			const allContracts = await db.gasContract.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				include: {
					unitContracts: {
						select: { unitId: true, isPrimary: true },
					},
				},
				orderBy: { name: "asc" },
			});

			// Get all daily entries for the month across all units
			const entries = await db.gasDailyEntry.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				include: {
					unit: true,
				},
				orderBy: { date: "asc" },
			});

			// Get all daily plans for the month across all units
			const plans = await db.gasDailyPlan.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				orderBy: { date: "asc" },
			});

			// Get all real consumption data for the month across all units
			const realConsumptions = await db.gasRealConsumption.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				orderBy: { date: "asc" },
			});

			// Group data by date
			const dailySummaries: Record<
				string,
				{
					date: Date;
					qdcTotal: number;
					qdsTotal: number;
					qdpTotal: number;
					qdrTotal: number;
					status: "ok" | "nok";
					transportStatus: "within" | "exceeded_upper" | "exceeded_lower";
					moleculeStatus: "within" | "exceeded";
					deviations: {
						transportUpperLimit: number;
						transportLowerLimit: number;
						transportDeviation: number;
						transportDeviationPercent: number;
						moleculeUpperLimit: number;
						moleculeLowerLimit: number;
						moleculeDeviation: number;
						moleculeDeviationPercent: number;
					};
					units: Array<{
						unitId: string;
						unitCode: string;
						unitName: string;
						qdc: number;
						qds: number;
						qdp: number | null;
						qdr: number | null;
					}>;
				}
			> = {};

			// Process entries to aggregate by date
			for (const entry of entries) {
				const dateKey = entry.date.toISOString().split("T")[0] ?? "";

				if (!dailySummaries[dateKey]) {
					dailySummaries[dateKey] = {
						date: entry.date,
						qdcTotal: 0,
						qdsTotal: 0,
						qdpTotal: 0,
						qdrTotal: 0,
						status: "ok",
						transportStatus: "within",
						moleculeStatus: "within",
						deviations: {
							transportUpperLimit: 0,
							transportLowerLimit: 0,
							transportDeviation: 0,
							transportDeviationPercent: 0,
							moleculeUpperLimit: 0,
							moleculeLowerLimit: 0,
							moleculeDeviation: 0,
							moleculeDeviationPercent: 0,
						},
						units: [],
					};
				}

				const summary = dailySummaries[dateKey];
				if (!summary) continue;

				const qdc = entry.qdcAtomizer + entry.qdcLines;
				const qds = entry.qdsManual ?? entry.qdsCalculated;

				// Find matching plan and real consumption for this unit and date
				const plan = plans.find(
					(p) =>
						p.unitId === entry.unitId &&
						p.date.toISOString().split("T")[0] === dateKey,
				);
				const realConsumption = realConsumptions.find(
					(r) =>
						r.unitId === entry.unitId &&
						r.date.toISOString().split("T")[0] === dateKey,
				);

				summary.qdcTotal += qdc;
				summary.qdsTotal += qds;
				summary.qdpTotal += plan?.qdpValue ?? 0;
				summary.qdrTotal += realConsumption?.qdrValue ?? 0;

				summary.units.push({
					unitId: entry.unitId,
					unitCode: entry.unit.code,
					unitName: entry.unit.name,
					qdc,
					qds,
					qdp: plan?.qdpValue ?? null,
					qdr: realConsumption?.qdrValue ?? null,
				});
			}

			// Calculate deviations and status for each day
			for (const dateKey in dailySummaries) {
				const summary = dailySummaries[dateKey];
				if (!summary) continue;

				const deviations = GasCalculationService.calculateDeviations(
					{ qdsCalculated: summary.qdsTotal },
					{
						qdcContracted: contract.qdcContracted,
						transportToleranceUpperPercent:
							contract.transportToleranceUpperPercent,
						transportToleranceLowerPercent:
							contract.transportToleranceLowerPercent,
						moleculeTolerancePercent: contract.moleculeTolerancePercent,
					},
				);

				summary.transportStatus = deviations.transportStatus;
				summary.moleculeStatus = deviations.moleculeStatus;
				summary.deviations = {
					transportUpperLimit: deviations.transportUpperLimit,
					transportLowerLimit: deviations.transportLowerLimit,
					transportDeviation: deviations.transportDeviation,
					transportDeviationPercent: deviations.transportDeviationPercent,
					moleculeUpperLimit: deviations.moleculeUpperLimit,
					moleculeLowerLimit: deviations.moleculeLowerLimit,
					moleculeDeviation: deviations.moleculeDeviation,
					moleculeDeviationPercent: deviations.moleculeDeviationPercent,
				};

				// Status is NOK if either transport or molecule tolerance is exceeded
				summary.status =
					deviations.transportStatus === "within" &&
					deviations.moleculeStatus === "within"
						? "ok"
						: "nok";
			}

			// Convert to array sorted by date
			const consolidatedData = Object.values(dailySummaries).sort(
				(a, b) => a.date.getTime() - b.date.getTime(),
			);

			return {
				month,
				contract: {
					id: contract.id,
					name: contract.name,
					qdcContracted: contract.qdcContracted,
					transportToleranceUpperPercent:
						contract.transportToleranceUpperPercent,
					transportToleranceLowerPercent:
						contract.transportToleranceLowerPercent,
					moleculeTolerancePercent: contract.moleculeTolerancePercent,
				},
				contracts: allContracts.map((c) => ({
					id: c.id,
					name: c.name,
					qdcContracted: c.qdcContracted,
					unitIds: c.unitContracts.map((uc) => uc.unitId),
				})),
				units: units.map((u) => ({
					id: u.id,
					code: u.code,
					name: u.name,
				})),
				dailySummaries: consolidatedData,
			};
		},
		{
			auth: true,
			query: t.Object({
				month: t.String(),
				contractId: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					month: t.String(),
					contract: t.Object({
						id: t.String(),
						name: t.String(),
						qdcContracted: t.Number(),
						transportToleranceUpperPercent: t.Number(),
						transportToleranceLowerPercent: t.Number(),
						moleculeTolerancePercent: t.Number(),
					}),
					contracts: t.Array(
						t.Object({
							id: t.String(),
							name: t.String(),
							qdcContracted: t.Number(),
							unitIds: t.Array(t.String()),
						}),
					),
					units: t.Array(
						t.Object({
							id: t.String(),
							code: t.String(),
							name: t.String(),
						}),
					),
					dailySummaries: t.Array(
						t.Object({
							date: t.Date(),
							qdcTotal: t.Number(),
							qdsTotal: t.Number(),
							qdpTotal: t.Number(),
							qdrTotal: t.Number(),
							status: t.Union([t.Literal("ok"), t.Literal("nok")]),
							transportStatus: t.Union([
								t.Literal("within"),
								t.Literal("exceeded_upper"),
								t.Literal("exceeded_lower"),
							]),
							moleculeStatus: t.Union([
								t.Literal("within"),
								t.Literal("exceeded"),
							]),
							deviations: t.Object({
								transportUpperLimit: t.Number(),
								transportLowerLimit: t.Number(),
								transportDeviation: t.Number(),
								transportDeviationPercent: t.Number(),
								moleculeUpperLimit: t.Number(),
								moleculeLowerLimit: t.Number(),
								moleculeDeviation: t.Number(),
								moleculeDeviationPercent: t.Number(),
							}),
							units: t.Array(
								t.Object({
									unitId: t.String(),
									unitCode: t.String(),
									unitName: t.String(),
									qdc: t.Number(),
									qds: t.Number(),
									qdp: t.Nullable(t.Number()),
									qdr: t.Nullable(t.Number()),
								}),
							),
						}),
					),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/reports/petrobras
	 *
	 * Returns preview data for Petrobras report export.
	 * Query parameter:
	 * - month: YYYY-MM format (required)
	 *
	 * Returns:
	 * - All daily entries for the month with calculated values
	 * - Contract tolerance information
	 * - Suggested filename following pattern: RC_{MONTH}_{YEAR}_Petrobras.xlsx
	 */
	.get(
		"/reports/petrobras",
		async ({ query, status, session }) => {
			const { month } = query;

			// Validate month format
			const monthRegex = /^\d{4}-\d{2}$/;
			if (!monthRegex.test(month)) {
				return status(400, {
					error: "Invalid month format. Expected YYYY-MM",
				});
			}

			// Parse month to get start and end dates
			const parts = month.split("-").map(Number);
			const year = parts[0] ?? 0;
			const monthNum = parts[1] ?? 1;
			const startDate = new Date(year, monthNum - 1, 1);
			const endDate = new Date(year, monthNum, 0); // Last day of month

			// Get active contract (or specific contract if contractId provided)
			const contract = query.contractId
				? await db.gasContract.findFirst({
						where: {
							id: query.contractId,
							organizationId: session.activeOrganizationId ?? undefined,
						},
					})
				: await db.gasContract.findFirst({
						where: {
							organizationId: session.activeOrganizationId ?? undefined,
							active: true,
							effectiveFrom: { lte: endDate },
							OR: [
								{ effectiveTo: null },
								{ effectiveTo: { gte: startDate } },
							],
						},
						orderBy: { effectiveFrom: "desc" },
					});

			if (!contract) {
				return status(404, { error: "No active contract found" });
			}

			// Get all units for the organization
			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				orderBy: { code: "asc" },
			});

			// Get all daily entries for the month across all units
			const entries = await db.gasDailyEntry.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				include: {
					unit: true,
				},
				orderBy: [{ date: "asc" }, { unit: { code: "asc" } }],
			});

			// Get all daily plans for the month
			const plans = await db.gasDailyPlan.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				orderBy: { date: "asc" },
			});

			// Get all real consumption data for the month
			const realConsumptions = await db.gasRealConsumption.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				orderBy: { date: "asc" },
			});

			// Build report rows grouped by date
			const reportRows: Array<{
				date: Date;
				dayOfWeek: string;
				qdcContracted: number;
				qdsTotal: number;
				qdpTotal: number;
				qdrTotal: number;
				transportUpperLimit: number;
				transportLowerLimit: number;
				moleculeUpperLimit: number;
				moleculeLowerLimit: number;
				transportDeviation: number;
				moleculeDeviation: number;
				transportStatus: "within" | "exceeded_upper" | "exceeded_lower";
				moleculeStatus: "within" | "exceeded";
				overallStatus: "ok" | "nok";
				units: Array<{
					unitCode: string;
					unitName: string;
					qds: number;
					qdp: number | null;
					qdr: number | null;
				}>;
			}> = [];

			// Group data by date
			const dateGroups: Record<
				string,
				{
					date: Date;
					entries: typeof entries;
					plans: typeof plans;
					realConsumptions: typeof realConsumptions;
				}
			> = {};

			// Initialize date groups for all days in the month
			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const dateKey = currentDate.toISOString().split("T")[0] ?? "";
				dateGroups[dateKey] = {
					date: new Date(currentDate),
					entries: [],
					plans: [],
					realConsumptions: [],
				};
				currentDate.setDate(currentDate.getDate() + 1);
			}

			// Populate date groups with entries
			for (const entry of entries) {
				const dateKey = entry.date.toISOString().split("T")[0] ?? "";
				if (dateGroups[dateKey]) {
					dateGroups[dateKey].entries.push(entry);
				}
			}

			for (const plan of plans) {
				const dateKey = plan.date.toISOString().split("T")[0] ?? "";
				if (dateGroups[dateKey]) {
					dateGroups[dateKey].plans.push(plan);
				}
			}

			for (const rc of realConsumptions) {
				const dateKey = rc.date.toISOString().split("T")[0] ?? "";
				if (dateGroups[dateKey]) {
					dateGroups[dateKey].realConsumptions.push(rc);
				}
			}

			// Day of week names in Portuguese
			const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

			// Process each date group
			for (const dateKey of Object.keys(dateGroups).sort()) {
				const group = dateGroups[dateKey];
				if (!group) continue;

				// Calculate totals
				let qdsTotal = 0;
				let qdpTotal = 0;
				let qdrTotal = 0;

				const unitData: Array<{
					unitCode: string;
					unitName: string;
					qds: number;
					qdp: number | null;
					qdr: number | null;
				}> = [];

				for (const unit of units) {
					const entry = group.entries.find((e) => e.unitId === unit.id);
					const plan = group.plans.find((p) => p.unitId === unit.id);
					const rc = group.realConsumptions.find((r) => r.unitId === unit.id);

					const qds = entry ? (entry.qdsManual ?? entry.qdsCalculated) : 0;
					const qdp = plan?.qdpValue ?? null;
					const qdr = rc?.qdrValue ?? null;

					qdsTotal += qds;
					if (qdp !== null) qdpTotal += qdp;
					if (qdr !== null) qdrTotal += qdr;

					unitData.push({
						unitCode: unit.code,
						unitName: unit.name,
						qds,
						qdp,
						qdr,
					});
				}

				// Calculate deviations
				const deviations = GasCalculationService.calculateDeviations(
					{ qdsCalculated: qdsTotal },
					{
						qdcContracted: contract.qdcContracted,
						transportToleranceUpperPercent:
							contract.transportToleranceUpperPercent,
						transportToleranceLowerPercent:
							contract.transportToleranceLowerPercent,
						moleculeTolerancePercent: contract.moleculeTolerancePercent,
					},
				);

				reportRows.push({
					date: group.date,
					dayOfWeek: dayNames[group.date.getDay()] ?? "",
					qdcContracted: contract.qdcContracted,
					qdsTotal,
					qdpTotal,
					qdrTotal,
					transportUpperLimit: deviations.transportUpperLimit,
					transportLowerLimit: deviations.transportLowerLimit,
					moleculeUpperLimit: deviations.moleculeUpperLimit,
					moleculeLowerLimit: deviations.moleculeLowerLimit,
					transportDeviation: deviations.transportDeviation,
					moleculeDeviation: deviations.moleculeDeviation,
					transportStatus: deviations.transportStatus,
					moleculeStatus: deviations.moleculeStatus,
					overallStatus:
						deviations.transportStatus === "within" &&
						deviations.moleculeStatus === "within"
							? "ok"
							: "nok",
					units: unitData,
				});
			}

			// Generate suggested filename
			const monthNames = [
				"Janeiro",
				"Fevereiro",
				"Março",
				"Abril",
				"Maio",
				"Junho",
				"Julho",
				"Agosto",
				"Setembro",
				"Outubro",
				"Novembro",
				"Dezembro",
			];
			const monthName = monthNames[monthNum - 1] ?? "";
			const suggestedFilename = `RC_${monthName}_${year}_Petrobras.xlsx`;

			return {
				month,
				year,
				monthName,
				suggestedFilename,
				contract: {
					id: contract.id,
					name: contract.name,
					qdcContracted: contract.qdcContracted,
					transportToleranceUpperPercent:
						contract.transportToleranceUpperPercent,
					transportToleranceLowerPercent:
						contract.transportToleranceLowerPercent,
					moleculeTolerancePercent: contract.moleculeTolerancePercent,
				},
				units: units.map((u) => ({
					id: u.id,
					code: u.code,
					name: u.name,
				})),
				rows: reportRows,
				summary: {
					totalDays: reportRows.length,
					daysWithData: reportRows.filter((r) => r.qdsTotal > 0).length,
					daysOk: reportRows.filter((r) => r.overallStatus === "ok").length,
					daysNok: reportRows.filter((r) => r.overallStatus === "nok").length,
					averageQds:
						reportRows.length > 0
							? reportRows.reduce((sum, r) => sum + r.qdsTotal, 0) /
								reportRows.length
							: 0,
				},
			};
		},
		{
			auth: true,
			query: t.Object({
				month: t.String(),
				contractId: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					month: t.String(),
					year: t.Number(),
					monthName: t.String(),
					suggestedFilename: t.String(),
					contract: t.Object({
						id: t.String(),
						name: t.String(),
						qdcContracted: t.Number(),
						transportToleranceUpperPercent: t.Number(),
						transportToleranceLowerPercent: t.Number(),
						moleculeTolerancePercent: t.Number(),
					}),
					units: t.Array(
						t.Object({
							id: t.String(),
							code: t.String(),
							name: t.String(),
						}),
					),
					rows: t.Array(
						t.Object({
							date: t.Date(),
							dayOfWeek: t.String(),
							qdcContracted: t.Number(),
							qdsTotal: t.Number(),
							qdpTotal: t.Number(),
							qdrTotal: t.Number(),
							transportUpperLimit: t.Number(),
							transportLowerLimit: t.Number(),
							moleculeUpperLimit: t.Number(),
							moleculeLowerLimit: t.Number(),
							transportDeviation: t.Number(),
							moleculeDeviation: t.Number(),
							transportStatus: t.Union([
								t.Literal("within"),
								t.Literal("exceeded_upper"),
								t.Literal("exceeded_lower"),
							]),
							moleculeStatus: t.Union([
								t.Literal("within"),
								t.Literal("exceeded"),
							]),
							overallStatus: t.Union([t.Literal("ok"), t.Literal("nok")]),
							units: t.Array(
								t.Object({
									unitCode: t.String(),
									unitName: t.String(),
									qds: t.Number(),
									qdp: t.Nullable(t.Number()),
									qdr: t.Nullable(t.Number()),
								}),
							),
						}),
					),
					summary: t.Object({
						totalDays: t.Number(),
						daysWithData: t.Number(),
						daysOk: t.Number(),
						daysNok: t.Number(),
						averageQds: t.Number(),
					}),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/reports/petrobras/download
	 *
	 * Downloads the Petrobras report as an XLSX file.
	 * Query parameter:
	 * - month: YYYY-MM format (required)
	 *
	 * Returns:
	 * - XLSX file with filename: RC_{MONTH}_{YEAR}_Petrobras.xlsx
	 */
	.get(
		"/reports/petrobras/download",
		async ({ query, status, session, set }) => {
			const { month } = query;

			// Validate month format
			const monthRegex = /^\d{4}-\d{2}$/;
			if (!monthRegex.test(month)) {
				return status(400, {
					error: "Invalid month format. Expected YYYY-MM",
				});
			}

			// Parse month to get start and end dates
			const parts = month.split("-").map(Number);
			const year = parts[0] ?? 0;
			const monthNum = parts[1] ?? 1;
			const startDate = new Date(year, monthNum - 1, 1);
			const endDate = new Date(year, monthNum, 0); // Last day of month

			// Get active contract (or specific contract if contractId provided)
			const contract = query.contractId
				? await db.gasContract.findFirst({
						where: {
							id: query.contractId,
							organizationId: session.activeOrganizationId ?? undefined,
						},
					})
				: await db.gasContract.findFirst({
						where: {
							organizationId: session.activeOrganizationId ?? undefined,
							active: true,
							effectiveFrom: { lte: endDate },
							OR: [
								{ effectiveTo: null },
								{ effectiveTo: { gte: startDate } },
							],
						},
						orderBy: { effectiveFrom: "desc" },
					});

			if (!contract) {
				return status(404, { error: "No active contract found" });
			}

			// Get all units for the organization
			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				orderBy: { code: "asc" },
			});

			// Get all daily entries for the month across all units
			const entries = await db.gasDailyEntry.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
				include: {
					unit: true,
				},
				orderBy: [{ date: "asc" }, { unit: { code: "asc" } }],
			});

			// Get all daily plans and real consumption
			const plans = await db.gasDailyPlan.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
			});

			const realConsumptions = await db.gasRealConsumption.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: {
						gte: startDate,
						lte: endDate,
					},
				},
			});

			// Create workbook
			const workbook = new ExcelJS.Workbook();
			workbook.creator = "Sistema RC - Gestão de Consumo de Gás";
			workbook.created = new Date();

			const worksheet = workbook.addWorksheet("Relatório Petrobras");

			// Define columns
			const columns: Partial<ExcelJS.Column>[] = [
				{ header: "Data", key: "date", width: 12 },
				{ header: "Dia", key: "dayOfWeek", width: 6 },
				{ header: "QDC (m³)", key: "qdc", width: 15 },
			];

			// Add unit columns for QDS
			for (const unit of units) {
				columns.push({
					header: `QDS ${unit.code} (m³)`,
					key: `qds_${unit.code}`,
					width: 15,
				});
			}

			// Add total and tolerance columns
			columns.push(
				{ header: "QDS Total (m³)", key: "qdsTotal", width: 15 },
				{ header: "QDP Total (m³)", key: "qdpTotal", width: 15 },
				{ header: "QDR Total (m³)", key: "qdrTotal", width: 15 },
				{
					header: "Lim. Sup. Transporte (m³)",
					key: "transportUpper",
					width: 20,
				},
				{
					header: "Lim. Inf. Transporte (m³)",
					key: "transportLower",
					width: 20,
				},
				{ header: "Desvio Transporte (m³)", key: "transportDev", width: 18 },
				{ header: "Status Transporte", key: "transportStatus", width: 16 },
				{ header: "Lim. Sup. Molécula (m³)", key: "moleculeUpper", width: 18 },
				{ header: "Lim. Inf. Molécula (m³)", key: "moleculeLower", width: 18 },
				{ header: "Desvio Molécula (m³)", key: "moleculeDev", width: 16 },
				{ header: "Status Molécula", key: "moleculeStatus", width: 14 },
				{ header: "Status Geral", key: "overallStatus", width: 12 },
			);

			worksheet.columns = columns;

			// Style header row
			const headerRow = worksheet.getRow(1);
			headerRow.font = { bold: true };
			headerRow.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FF4472C4" },
			};
			headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

			// Day of week names in Portuguese
			const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

			// Group entries by date
			const dateGroups: Record<string, typeof entries> = {};
			for (const entry of entries) {
				const dateKey = entry.date.toISOString().split("T")[0] ?? "";
				if (!dateGroups[dateKey]) {
					dateGroups[dateKey] = [];
				}
				dateGroups[dateKey].push(entry);
			}

			// Add data rows for each day of the month
			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const dateKey = currentDate.toISOString().split("T")[0] ?? "";
				const dayEntries = dateGroups[dateKey] ?? [];

				// Calculate totals for this day
				let qdsTotal = 0;
				let qdpTotal = 0;
				let qdrTotal = 0;

				const rowData: Record<string, unknown> = {
					date: currentDate.toLocaleDateString("pt-BR"),
					dayOfWeek: dayNames[currentDate.getDay()] ?? "",
					qdc: contract.qdcContracted,
				};

				// Add unit-specific QDS values
				for (const unit of units) {
					const entry = dayEntries.find((e) => e.unitId === unit.id);
					const qds = entry ? (entry.qdsManual ?? entry.qdsCalculated) : 0;
					rowData[`qds_${unit.code}`] = qds;
					qdsTotal += qds;

					// Find QDP and QDR for this unit
					const plan = plans.find(
						(p) =>
							p.unitId === unit.id &&
							p.date.toISOString().split("T")[0] === dateKey,
					);
					const rc = realConsumptions.find(
						(r) =>
							r.unitId === unit.id &&
							r.date.toISOString().split("T")[0] === dateKey,
					);

					if (plan) qdpTotal += plan.qdpValue;
					if (rc) qdrTotal += rc.qdrValue;
				}

				// Calculate deviations
				const deviations = GasCalculationService.calculateDeviations(
					{ qdsCalculated: qdsTotal },
					{
						qdcContracted: contract.qdcContracted,
						transportToleranceUpperPercent:
							contract.transportToleranceUpperPercent,
						transportToleranceLowerPercent:
							contract.transportToleranceLowerPercent,
						moleculeTolerancePercent: contract.moleculeTolerancePercent,
					},
				);

				// Add totals and deviation data
				rowData.qdsTotal = qdsTotal;
				rowData.qdpTotal = qdpTotal;
				rowData.qdrTotal = qdrTotal;
				rowData.transportUpper = deviations.transportUpperLimit;
				rowData.transportLower = deviations.transportLowerLimit;
				rowData.transportDev = deviations.transportDeviation;
				rowData.transportStatus =
					deviations.transportStatus === "within"
						? "OK"
						: deviations.transportStatus === "exceeded_upper"
							? "ACIMA"
							: "ABAIXO";
				rowData.moleculeUpper = deviations.moleculeUpperLimit;
				rowData.moleculeLower = deviations.moleculeLowerLimit;
				rowData.moleculeDev = deviations.moleculeDeviation;
				rowData.moleculeStatus =
					deviations.moleculeStatus === "within" ? "OK" : "EXCEDIDO";
				rowData.overallStatus =
					deviations.transportStatus === "within" &&
					deviations.moleculeStatus === "within"
						? "OK"
						: "NOK";

				const row = worksheet.addRow(rowData);

				// Color-code status cells
				const overallStatusCell = row.getCell("overallStatus");
				if (rowData.overallStatus === "OK") {
					overallStatusCell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "FF92D050" }, // Green
					};
				} else {
					overallStatusCell.fill = {
						type: "pattern",
						pattern: "solid",
						fgColor: { argb: "FFFF6B6B" }, // Red
					};
				}

				currentDate.setDate(currentDate.getDate() + 1);
			}

			// Add summary row
			worksheet.addRow({});
			const summaryRow = worksheet.addRow({
				date: "RESUMO",
				dayOfWeek: "",
				qdc: contract.qdcContracted,
			});
			summaryRow.font = { bold: true };

			// Format number columns
			const numericColumns = [
				"qdc",
				"qdsTotal",
				"qdpTotal",
				"qdrTotal",
				"transportUpper",
				"transportLower",
				"transportDev",
				"moleculeUpper",
				"moleculeLower",
				"moleculeDev",
			];
			for (const unit of units) {
				numericColumns.push(`qds_${unit.code}`);
			}

			for (const colKey of numericColumns) {
				const col = worksheet.getColumn(colKey);
				col.numFmt = "#,##0";
			}

			// Generate filename
			const monthNames = [
				"Janeiro",
				"Fevereiro",
				"Marco",
				"Abril",
				"Maio",
				"Junho",
				"Julho",
				"Agosto",
				"Setembro",
				"Outubro",
				"Novembro",
				"Dezembro",
			];
			const monthName = monthNames[monthNum - 1] ?? "";
			const filename = `RC_${monthName}_${year}_Petrobras.xlsx`;

			// Generate buffer
			const buffer = await workbook.xlsx.writeBuffer();

			// Set response headers for file download
			set.headers["Content-Type"] =
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
			set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;

			return buffer;
		},
		{
			auth: true,
			query: t.Object({
				month: t.String(),
				contractId: t.Optional(t.String()),
			}),
			response: {
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/admin/units
	 *
	 * Returns all units with their equipment and current constants.
	 * Used by admin page to list and manage equipment configurations.
	 */
	.get(
		"/admin/units",
		async ({ session }) => {
			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
				},
				include: {
					equipment: {
						orderBy: { orderIndex: "asc" },
						include: {
							constants: {
								orderBy: { effectiveFrom: "desc" },
							},
						},
					},
				},
				orderBy: { code: "asc" },
			});

			return units;
		},
		{
			auth: true,
			response: {
				200: t.Array(
					t.Object({
						id: t.String(),
						code: t.String(),
						name: t.String(),
						description: t.Nullable(t.String()),
						active: t.Boolean(),
						createdAt: t.Date(),
						updatedAt: t.Date(),
						organizationId: t.Nullable(t.String()),
						equipment: t.Array(
							t.Object({
								id: t.String(),
								unitId: t.String(),
								code: t.String(),
								name: t.String(),
								type: t.String(),
								active: t.Boolean(),
								orderIndex: t.Number(),
								createdAt: t.Date(),
								updatedAt: t.Date(),
								constants: t.Array(
									t.Object({
										id: t.String(),
										equipmentId: t.String(),
										consumptionRate: t.Number(),
										consumptionUnit: t.String(),
										effectiveFrom: t.Date(),
										effectiveTo: t.Nullable(t.Date()),
										notes: t.Nullable(t.String()),
										createdAt: t.Date(),
										createdById: t.Nullable(t.String()),
									}),
								),
							}),
						),
					}),
				),
			},
		},
	)

	/**
	 * PUT /gas/admin/equipment/:equipmentId/constant
	 *
	 * Updates the consumption rate for an equipment by:
	 * 1. Closing the current active constant (setting effectiveTo)
	 * 2. Creating a new constant with the new rate effective from the given date
	 *
	 * This maintains a complete history of all constant changes for audit purposes.
	 */
	.put(
		"/admin/equipment/:equipmentId/constant",
		async ({ params, body, user, session, status }) => {
			const { equipmentId } = params;

			// Verify equipment exists
			const equipment = await db.gasEquipment.findUnique({
				where: { id: equipmentId },
				include: {
					unit: true,
					constants: {
						where: { effectiveTo: null },
						orderBy: { effectiveFrom: "desc" },
						take: 1,
					},
				},
			});

			if (!equipment) {
				return status(404, { error: "Equipment not found" });
			}

			// Verify equipment belongs to user's organization
			if (equipment.unit.organizationId !== session.activeOrganizationId) {
				return status(403, { error: "Access denied" });
			}

			const effectiveDate = new Date(body.effectiveFrom);
			const currentConstant = equipment.constants[0];

			// Set up authenticated database client
			const userDb = authDb.$setAuth({
				userId: user.id,
				organizationId: session.activeOrganizationId ?? "",
				organizationRole: "member",
				role: "user",
			});

			// Close the current constant if it exists
			if (currentConstant) {
				await db.gasEquipmentConstant.update({
					where: { id: currentConstant.id },
					data: {
						effectiveTo: effectiveDate,
					},
				});
			}

			// Create new constant with the new rate
			const newConstant = await userDb.gasEquipmentConstant.create({
				data: {
					equipmentId,
					consumptionRate: body.consumptionRate,
					consumptionUnit:
						(body.consumptionUnit as "m3_per_hour" | "m3_per_day") ??
						"m3_per_hour",
					effectiveFrom: effectiveDate,
					notes: body.notes,
				},
			});

			// Audit log: equipment constant updated
			AuditService.logUpdate({
				entityType: "parameter",
				entityId: equipmentId,
				entityName: `${equipment.unit.name} - ${equipment.name ?? equipment.code}`,
				oldData: currentConstant
					? { consumptionRate: currentConstant.consumptionRate }
					: {},
				newData: { consumptionRate: body.consumptionRate },
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				organizationId: session.activeOrganizationId ?? undefined,
			});

			return {
				...newConstant,
				previousConstant: currentConstant
					? {
							id: currentConstant.id,
							consumptionRate: currentConstant.consumptionRate,
							effectiveFrom: currentConstant.effectiveFrom,
							effectiveTo: effectiveDate,
						}
					: null,
			};
		},
		{
			auth: true,
			params: t.Object({
				equipmentId: t.String(),
			}),
			body: t.Object({
				consumptionRate: t.Number({ minimum: 0 }),
				consumptionUnit: t.Optional(
					t.Union([t.Literal("m3_per_hour"), t.Literal("m3_per_day")]),
				),
				effectiveFrom: t.String({ format: "date" }),
				notes: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					id: t.String(),
					equipmentId: t.String(),
					consumptionRate: t.Number(),
					consumptionUnit: t.String(),
					effectiveFrom: t.Date(),
					effectiveTo: t.Nullable(t.Date()),
					notes: t.Nullable(t.String()),
					createdAt: t.Date(),
					createdById: t.Nullable(t.String()),
					previousConstant: t.Nullable(
						t.Object({
							id: t.String(),
							consumptionRate: t.Number(),
							effectiveFrom: t.Date(),
							effectiveTo: t.Date(),
						}),
					),
				}),
				403: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/admin/equipment/:equipmentId/history
	 *
	 * Returns the full history of constants for an equipment.
	 * Includes who made each change and when, for audit purposes.
	 */
	.get(
		"/admin/equipment/:equipmentId/history",
		async ({ params, session, status }) => {
			const { equipmentId } = params;

			// Verify equipment exists and belongs to user's organization
			const equipment = await db.gasEquipment.findUnique({
				where: { id: equipmentId },
				include: {
					unit: true,
				},
			});

			if (!equipment) {
				return status(404, { error: "Equipment not found" });
			}

			if (equipment.unit.organizationId !== session.activeOrganizationId) {
				return status(403, { error: "Access denied" });
			}

			// Get all constants for this equipment with creator info
			const constants = await db.gasEquipmentConstant.findMany({
				where: { equipmentId },
				include: {
					createdByUser: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: { effectiveFrom: "desc" },
			});

			return {
				equipment: {
					id: equipment.id,
					code: equipment.code,
					name: equipment.name,
					type: equipment.type,
				},
				unit: {
					id: equipment.unit.id,
					code: equipment.unit.code,
					name: equipment.unit.name,
				},
				history: constants.map((c) => ({
					id: c.id,
					consumptionRate: c.consumptionRate,
					consumptionUnit: c.consumptionUnit,
					effectiveFrom: c.effectiveFrom,
					effectiveTo: c.effectiveTo,
					notes: c.notes,
					createdAt: c.createdAt,
					createdBy: c.createdByUser
						? {
								id: c.createdByUser.id,
								name: c.createdByUser.name,
								email: c.createdByUser.email,
							}
						: null,
				})),
			};
		},
		{
			auth: true,
			params: t.Object({
				equipmentId: t.String(),
			}),
			response: {
				200: t.Object({
					equipment: t.Object({
						id: t.String(),
						code: t.String(),
						name: t.String(),
						type: t.String(),
					}),
					unit: t.Object({
						id: t.String(),
						code: t.String(),
						name: t.String(),
					}),
					history: t.Array(
						t.Object({
							id: t.String(),
							consumptionRate: t.Number(),
							consumptionUnit: t.String(),
							effectiveFrom: t.Date(),
							effectiveTo: t.Nullable(t.Date()),
							notes: t.Nullable(t.String()),
							createdAt: t.Date(),
							createdBy: t.Nullable(
								t.Object({
									id: t.String(),
									name: t.String(),
									email: t.String(),
								}),
							),
						}),
					),
				}),
				403: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/alerts/:alertId/sent-logs
	 *
	 * Returns the log of sent emails for a specific contract alert.
	 * Used by the UI to display email dispatch history.
	 */
	.get(
		"/alerts/:alertId/sent-logs",
		async ({ params, query, session, status }) => {
			const { alertId } = params;
			const limit = query.limit ?? 50;

			// Verify alert exists and belongs to user's organization
			const alert = await db.gasContractAlert.findUnique({
				where: { id: alertId },
			});

			if (!alert) {
				return status(404, { error: "Alert not found" });
			}

			if (alert.organizationId !== session.activeOrganizationId) {
				return status(403, { error: "Access denied" });
			}

			const logs = await ContractAlertService.getSentLogsForAlert(
				alertId,
				limit,
			);

			return {
				alertId,
				logs,
			};
		},
		{
			auth: true,
			params: t.Object({
				alertId: t.String(),
			}),
			query: t.Object({
				limit: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
			}),
			response: {
				200: t.Object({
					alertId: t.String(),
					logs: t.Array(
						t.Object({
							id: t.String(),
							recipientEmail: t.String(),
							sentAt: t.Date(),
							advanceNoticeDays: t.Number(),
							status: t.String(),
							errorMessage: t.Nullable(t.String()),
						}),
					),
				}),
				403: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * POST /gas/alerts/process
	 *
	 * Manually triggers processing of due contract alerts.
	 * Useful for testing or forcing alert dispatch outside the scheduled time.
	 * Returns a summary of sent emails.
	 */
	.post(
		"/alerts/process",
		async ({ organizationRole, status }) => {
			// Only allow admins to manually trigger alert processing
			if (organizationRole !== "admin" && organizationRole !== "owner") {
				return status(403, {
					error: "Only organization admins can trigger alert processing",
				});
			}

			const result = await ContractAlertService.processAndDispatchAlerts();

			return {
				success: true,
				...result,
			};
		},
		{
			auth: true,
			response: {
				200: t.Object({
					success: t.Boolean(),
					totalAlerts: t.Number(),
					totalEmails: t.Number(),
					sentEmails: t.Number(),
					failedEmails: t.Number(),
					details: t.Array(
						t.Object({
							alertName: t.String(),
							contractName: t.String(),
							advanceNoticeDays: t.Number(),
							results: t.Array(
								t.Object({
									alertId: t.String(),
									email: t.String(),
									status: t.Union([t.Literal("sent"), t.Literal("failed")]),
									errorMessage: t.Optional(t.String()),
								}),
							),
						}),
					),
				}),
				403: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * POST /gas/daily-plans/:planId/submit
	 *
	 * Submits a daily plan for approval.
	 * Sets submitted=true, submittedAt, and submittedById.
	 */
	.post(
		"/daily-plans/:planId/submit",
		async ({ params, user, status }) => {
			const { planId } = params;

			const plan = await db.gasDailyPlan.findUnique({
				where: { id: planId },
			});

			if (!plan) {
				return status(404, { error: "Plan not found" });
			}

			if (plan.submitted) {
				return status(400, { error: "Plan is already submitted" });
			}

			const updated = await db.gasDailyPlan.update({
				where: { id: planId },
				data: {
					submitted: true,
					submittedAt: new Date(),
					submittedById: user.id,
				},
			});

			// Audit log: plan submitted
			AuditService.logUpdate({
				entityType: "plan",
				entityId: planId,
				entityName: `Programação ${plan.date instanceof Date ? plan.date.toISOString().split("T")[0] : plan.date}`,
				oldData: { submitted: false },
				newData: { submitted: true },
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				organizationId: undefined,
			});

			return {
				id: updated.id,
				submitted: updated.submitted,
				submittedAt: updated.submittedAt,
			};
		},
		{
			auth: true,
			params: t.Object({
				planId: t.String(),
			}),
			response: {
				200: t.Object({
					id: t.String(),
					submitted: t.Boolean(),
					submittedAt: t.Nullable(t.Date()),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * POST /gas/daily-plans/:planId/approve
	 *
	 * Approves or rejects a submitted daily plan.
	 * Body: { approved: boolean, rejectionReason?: string }
	 */
	.post(
		"/daily-plans/:planId/approve",
		async ({ params, body, user, status }) => {
			const { planId } = params;

			const plan = await db.gasDailyPlan.findUnique({
				where: { id: planId },
			});

			if (!plan) {
				return status(404, { error: "Plan not found" });
			}

			if (!plan.submitted) {
				return status(400, { error: "Plan must be submitted before approval" });
			}

			if (plan.approved !== null) {
				return status(400, { error: "Plan has already been reviewed" });
			}

			const updated = await db.gasDailyPlan.update({
				where: { id: planId },
				data: {
					approved: body.approved,
					approvedAt: new Date(),
					approvedById: user.id,
					rejectionReason: body.approved
						? null
						: (body.rejectionReason ?? null),
				},
			});

			// Audit log: plan approved or rejected
			AuditService.logUpdate({
				entityType: "plan",
				entityId: planId,
				entityName: `Programação ${plan.date instanceof Date ? plan.date.toISOString().split("T")[0] : plan.date}`,
				oldData: { approved: null },
				newData: {
					approved: body.approved,
					...(body.rejectionReason ? { rejectionReason: body.rejectionReason } : {}),
				},
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				organizationId: undefined,
			});

			return {
				id: updated.id,
				approved: updated.approved,
				approvedAt: updated.approvedAt,
				rejectionReason: updated.rejectionReason,
			};
		},
		{
			auth: true,
			params: t.Object({
				planId: t.String(),
			}),
			body: t.Object({
				approved: t.Boolean(),
				rejectionReason: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					id: t.String(),
					approved: t.Nullable(t.Boolean()),
					approvedAt: t.Nullable(t.Date()),
					rejectionReason: t.Nullable(t.String()),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * GET /gas/monthly-scorecard
	 *
	 * Returns monthly scorecard data: assertiveness rate, accumulated penalties,
	 * and average accuracy for the selected month.
	 *
	 * Query parameters:
	 * - month: YYYY-MM format (required)
	 * - unitId: optional unit filter
	 */
	.get(
		"/monthly-scorecard",
		async ({ query, status, session }) => {
			const { month, unitId } = query;

			const monthRegex = /^\d{4}-\d{2}$/;
			if (!monthRegex.test(month)) {
				return status(400, {
					error: "Invalid month format. Expected YYYY-MM",
				});
			}

			const parts = month.split("-").map(Number);
			const year = parts[0] ?? 0;
			const monthNum = parts[1] ?? 1;
			const startDate = new Date(year, monthNum - 1, 1);
			const endDate = new Date(year, monthNum, 0);

			// Get active contract with penalty parameters
			// If contractId is specified, use that contract directly
			const contract = query.contractId
				? await db.gasContract.findFirst({
						where: {
							id: query.contractId,
							organizationId: session.activeOrganizationId ?? undefined,
						},
					})
				: await db.gasContract.findFirst({
						where: {
							organizationId: session.activeOrganizationId ?? undefined,
							active: true,
							effectiveFrom: { lte: endDate },
							OR: [
								{ effectiveTo: null },
								{ effectiveTo: { gte: startDate } },
							],
						},
						orderBy: { effectiveFrom: "desc" },
					});

			if (!contract) {
				return status(404, { error: "No active contract found" });
			}

			// Get all contracts for selector
			const allContracts = await db.gasContract.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				orderBy: { name: "asc" },
			});

			// Get units
			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				orderBy: { code: "asc" },
			});

			const unitFilter = unitId
				? { unitId }
				: {
						unit: { organizationId: session.activeOrganizationId ?? undefined },
					};

			// Get daily plans (QDP) for the month
			const plans = await db.gasDailyPlan.findMany({
				where: {
					...unitFilter,
					date: { gte: startDate, lte: endDate },
				},
				orderBy: { date: "asc" },
			});

			// Get real consumption (QDR) for the month
			const realConsumptions = await db.gasRealConsumption.findMany({
				where: {
					...unitFilter,
					date: { gte: startDate, lte: endDate },
				},
				orderBy: { date: "asc" },
			});

			// Group QDP and QDR by date (aggregate across units if no unitId filter)
			const dailyData = new Map<string, { qdp: number; qdr: number }>();

			for (const plan of plans) {
				const dateKey = plan.date.toISOString().split("T")[0] ?? "";
				const existing = dailyData.get(dateKey) ?? { qdp: 0, qdr: 0 };
				existing.qdp += plan.qdpValue;
				dailyData.set(dateKey, existing);
			}

			for (const consumption of realConsumptions) {
				const dateKey = consumption.date.toISOString().split("T")[0] ?? "";
				const existing = dailyData.get(dateKey) ?? { qdp: 0, qdr: 0 };
				existing.qdr += consumption.qdrValue;
				dailyData.set(dateKey, existing);
			}

			// Calculate assertiveness and accuracy
			const days = Array.from(dailyData.values());
			const accuracyResult = GasCalculationService.calculateMonthlyAccuracy(
				days,
				contract.transportToleranceUpperPercent,
				contract.transportToleranceLowerPercent,
			);

			// Calculate accumulated penalties
			const penaltyParams = {
				qdcContracted: contract.qdcContracted,
				pvemaTolerancePercent:
					contract.pvemaTolerancePercent ??
					contract.transportToleranceUpperPercent,
				pvemeTolerancePercent:
					contract.pvemeTolerancePercent ??
					contract.transportToleranceLowerPercent,
				overdemandTier1MaxPercent: contract.overdemandTier1MaxPercent ?? 110,
				overdemandTier2MaxPercent: contract.overdemandTier2MaxPercent ?? 115,
				overdemandTier2Multiplier: contract.overdemandTier2Multiplier ?? 1.0,
				overdemandTier3Multiplier: contract.overdemandTier3Multiplier ?? 1.5,
				tusdTariffPerUnit: contract.tusdTariffPerUnit ?? 0,
				basePricePerUnit: contract.basePricePerUnit ?? 0,
			};

			const dailyQdrValues = days.map((d) => d.qdr);
			const penalties = GasCalculationService.calculateMonthlyPenalties(
				dailyQdrValues,
				penaltyParams,
			);

			return {
				month,
				contract: {
					id: contract.id,
					name: contract.name,
					qdcContracted: contract.qdcContracted,
					transportToleranceUpperPercent:
						contract.transportToleranceUpperPercent,
					transportToleranceLowerPercent:
						contract.transportToleranceLowerPercent,
				},
				contracts: allContracts.map((c) => ({
					id: c.id,
					name: c.name,
					qdcContracted: c.qdcContracted,
				})),
				units: units.map((u) => ({ id: u.id, code: u.code, name: u.name })),
				scorecard: {
					assertivenessRate: accuracyResult.assertivenessRate,
					averageAccuracyRate: accuracyResult.averageAccuracyRate,
					daysWithData: accuracyResult.daysWithData,
					daysWithinTolerance: accuracyResult.daysWithinTolerance,
					penalties: {
						pvema: penalties.pvema,
						pveme: penalties.pveme,
						sobredemanda: penalties.sobredemanda,
						total: penalties.total,
					},
				},
			};
		},
		{
			auth: true,
			query: t.Object({
				month: t.String(),
				unitId: t.Optional(t.String()),
				contractId: t.Optional(t.String()),
			}),
			response: {
				200: t.Object({
					month: t.String(),
					contract: t.Object({
						id: t.String(),
						name: t.String(),
						qdcContracted: t.Number(),
						transportToleranceUpperPercent: t.Number(),
						transportToleranceLowerPercent: t.Number(),
					}),
					contracts: t.Array(
						t.Object({
							id: t.String(),
							name: t.String(),
							qdcContracted: t.Number(),
						}),
					),
					units: t.Array(
						t.Object({
							id: t.String(),
							code: t.String(),
							name: t.String(),
						}),
					),
					scorecard: t.Object({
						assertivenessRate: t.Number(),
						averageAccuracyRate: t.Number(),
						daysWithData: t.Number(),
						daysWithinTolerance: t.Number(),
						penalties: t.Object({
							pvema: t.Number(),
							pveme: t.Number(),
							sobredemanda: t.Number(),
							total: t.Number(),
						}),
					}),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * POST /gas/alerts/retry
	 *
	 * Retries all failed alert deliveries from the last 7 days.
	 * Admin only.
	 */
	.post(
		"/alerts/retry",
		async ({ organizationRole, status }) => {
			if (organizationRole !== "admin" && organizationRole !== "owner") {
				return status(403, {
					error: "Only organization admins can retry failed alerts",
				});
			}

			const result = await ContractAlertService.retryFailedAlerts();

			return {
				success: true,
				...result,
			};
		},
		{
			auth: true,
			response: {
				200: t.Object({
					success: t.Boolean(),
					totalRetried: t.Number(),
					succeeded: t.Number(),
					stillFailing: t.Number(),
					details: t.Array(
						t.Object({
							alertId: t.String(),
							email: t.String(),
							status: t.Union([t.Literal("sent"), t.Literal("failed")]),
							errorMessage: t.Optional(t.String()),
						}),
					),
				}),
				403: t.Object({
					error: t.String(),
				}),
			},
		},
	)

	/**
	 * POST /gas/deviation-alerts/send-email
	 *
	 * Sends a deviation alert email to specified recipients.
	 */
	.post(
		"/deviation-alerts/send-email",
		async ({ body, status }) => {
			const {
				recipients,
				message,
				unitName,
				unitCode,
				contractName,
				date,
				scheduledVolume,
				actualVolume,
				deviationPercent,
				thresholdPercent,
			} = body;

			const results: Array<{
				email: string;
				status: "sent" | "failed";
				errorMessage?: string;
			}> = [];

			for (const recipient of recipients) {
				try {
					const emailTemplate = DeviationAlertEmail({
						recipientName: undefined,
						unitName,
						unitCode,
						contractName: contractName ?? undefined,
						date,
						scheduledVolume,
						actualVolume,
						deviationPercent,
						thresholdPercent,
						dashboardLink: `${APP_URL}/gas/deviation-alerts`,
					});

					await sendEmail({
						emailTemplate,
						to: recipient,
						subject: `[SS-GAS] Alerta de Desvio: ${unitName} - ${deviationPercent > 0 ? "+" : ""}${deviationPercent.toFixed(1)}%${message ? ` | ${message.slice(0, 50)}` : ""}`,
					});

					results.push({ email: recipient, status: "sent" });
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					results.push({ email: recipient, status: "failed", errorMessage });
				}
			}

			const sent = results.filter((r) => r.status === "sent").length;
			const failed = results.filter((r) => r.status === "failed").length;

			return {
				success: failed === 0,
				totalEmails: results.length,
				sent,
				failed,
				results,
			};
		},
		{
			auth: true,
			body: t.Object({
				recipients: t.Array(t.String()),
				message: t.Optional(t.String()),
				unitName: t.String(),
				unitCode: t.String(),
				contractName: t.Nullable(t.String()),
				date: t.String(),
				scheduledVolume: t.Number(),
				actualVolume: t.Number(),
				deviationPercent: t.Number(),
				thresholdPercent: t.Number(),
			}),
			response: {
				200: t.Object({
					success: t.Boolean(),
					totalEmails: t.Number(),
					sent: t.Number(),
					failed: t.Number(),
					results: t.Array(
						t.Object({
							email: t.String(),
							status: t.Union([t.Literal("sent"), t.Literal("failed")]),
							errorMessage: t.Optional(t.String()),
						}),
					),
				}),
			},
		},
	)

	/**
	 * GET /gas/equipment/:equipmentId/can-delete
	 *
	 * Checks if an equipment can be deleted.
	 * Equipment cannot be deleted if it has associated daily entries (line statuses).
	 */
	.get(
		"/equipment/:equipmentId/can-delete",
		async ({ params, status }) => {
			const { equipmentId } = params;

			const equipment = await db.gasEquipment.findUnique({
				where: { id: equipmentId },
			});

			if (!equipment) {
				return status(404, { error: "Equipment not found" });
			}

			const lineStatusCount = await db.gasLineStatus.count({
				where: { equipmentId },
			});

			if (lineStatusCount > 0) {
				return {
					canDelete: false,
					reason: `Este equipamento possui ${lineStatusCount} lançamento(s) diário(s) associado(s). Remova os lançamentos antes de excluir.`,
				};
			}

			return { canDelete: true, reason: null };
		},
		{
			detail: {
				summary: "Check if equipment can be deleted",
				tags: ["Gas Equipment"],
			},
		},
	)

	/**
	 * GET /gas/reports/dashboard
	 *
	 * Returns consolidated dashboard data for the reports overview.
	 * Supports date range filtering (monthly, quarterly, yearly).
	 *
	 * Returns:
	 * - Monthly QDP vs QDR per unit (for bar chart)
	 * - Monthly accumulated penalties per contract (for line chart)
	 * - Monthly assertiveness rates (for trend line chart)
	 * - Per-unit accuracy comparison (for horizontal bar chart)
	 * - Consumption distribution by equipment type (for pie chart)
	 */
	.get(
		"/reports/dashboard",
		async ({ query, status, session }) => {
			const { startMonth, endMonth, unitId, contractId } = query;

			const monthRegex = /^\d{4}-\d{2}$/;
			if (!monthRegex.test(startMonth) || !monthRegex.test(endMonth)) {
				return status(400, {
					error: "Invalid month format. Expected YYYY-MM",
				});
			}

			const startParts = startMonth.split("-").map(Number);
			const endParts = endMonth.split("-").map(Number);
			const startDate = new Date(
				startParts[0] ?? 0,
				(startParts[1] ?? 1) - 1,
				1,
			);
			const endDate = new Date(endParts[0] ?? 0, endParts[1] ?? 1, 0);

			// Get active contract
			const contract = contractId
				? await db.gasContract.findFirst({
						where: {
							id: contractId,
							organizationId: session.activeOrganizationId ?? undefined,
						},
					})
				: await db.gasContract.findFirst({
						where: {
							organizationId: session.activeOrganizationId ?? undefined,
							active: true,
							effectiveFrom: { lte: endDate },
							OR: [
								{ effectiveTo: null },
								{ effectiveTo: { gte: startDate } },
							],
						},
						orderBy: { effectiveFrom: "desc" },
					});

			if (!contract) {
				return status(404, { error: "No active contract found" });
			}

			// Get all contracts
			const allContracts = await db.gasContract.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				orderBy: { name: "asc" },
			});

			// Get units
			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
					...(unitId ? { id: unitId } : {}),
				},
				orderBy: { code: "asc" },
			});

			// Get all daily plans (QDP) for the range
			const unitFilter = unitId
				? { unitId }
				: {
						unit: {
							organizationId: session.activeOrganizationId ?? undefined,
						},
					};

			const plans = await db.gasDailyPlan.findMany({
				where: {
					...unitFilter,
					date: { gte: startDate, lte: endDate },
				},
				include: { unit: true },
				orderBy: { date: "asc" },
			});

			// Get all real consumption (QDR)
			const realConsumptions = await db.gasRealConsumption.findMany({
				where: {
					...unitFilter,
					date: { gte: startDate, lte: endDate },
				},
				include: { unit: true },
				orderBy: { date: "asc" },
			});

			// Get daily entries for equipment type distribution
			const entries = await db.gasDailyEntry.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
						...(unitId ? { id: unitId } : {}),
					},
					date: { gte: startDate, lte: endDate },
				},
				orderBy: { date: "asc" },
			});

			// === 1. Monthly QDP vs QDR per unit ===
			const monthlyByUnit: Record<
				string,
				Record<string, { qdp: number; qdr: number }>
			> = {};

			for (const plan of plans) {
				const monthKey = `${plan.date.getFullYear()}-${String(plan.date.getMonth() + 1).padStart(2, "0")}`;
				const uid = plan.unitId;
				if (!monthlyByUnit[monthKey]) monthlyByUnit[monthKey] = {};
				if (!monthlyByUnit[monthKey][uid])
					monthlyByUnit[monthKey][uid] = { qdp: 0, qdr: 0 };
				const entry = monthlyByUnit[monthKey][uid];
				if (entry) entry.qdp += plan.qdpValue;
			}

			for (const rc of realConsumptions) {
				const monthKey = `${rc.date.getFullYear()}-${String(rc.date.getMonth() + 1).padStart(2, "0")}`;
				const uid = rc.unitId;
				if (!monthlyByUnit[monthKey]) monthlyByUnit[monthKey] = {};
				if (!monthlyByUnit[monthKey][uid])
					monthlyByUnit[monthKey][uid] = { qdp: 0, qdr: 0 };
				const entry = monthlyByUnit[monthKey][uid];
				if (entry) entry.qdr += rc.qdrValue;
			}

			const consumptionByUnit = Object.entries(monthlyByUnit)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([month, unitData]) => ({
					month,
					units: Object.entries(unitData).map(([uid, values]) => {
						const unit = units.find((u) => u.id === uid);
						return {
							unitId: uid,
							unitCode: unit?.code ?? "",
							unitName: unit?.name ?? "",
							qdp: Math.round(values.qdp * 100) / 100,
							qdr: Math.round(values.qdr * 100) / 100,
						};
					}),
				}));

			// === 2. Monthly penalties ===
			const penaltyParams = {
				qdcContracted: contract.qdcContracted,
				pvemaTolerancePercent:
					contract.pvemaTolerancePercent ??
					contract.transportToleranceUpperPercent,
				pvemeTolerancePercent:
					contract.pvemeTolerancePercent ??
					contract.transportToleranceLowerPercent,
				overdemandTier1MaxPercent:
					contract.overdemandTier1MaxPercent ?? 110,
				overdemandTier2MaxPercent:
					contract.overdemandTier2MaxPercent ?? 115,
				overdemandTier2Multiplier:
					contract.overdemandTier2Multiplier ?? 1.0,
				overdemandTier3Multiplier:
					contract.overdemandTier3Multiplier ?? 1.5,
				tusdTariffPerUnit: contract.tusdTariffPerUnit ?? 0,
				basePricePerUnit: contract.basePricePerUnit ?? 0,
			};

			// Group QDR by month for penalty calc
			const qdrByMonth: Record<string, number[]> = {};
			for (const rc of realConsumptions) {
				const monthKey = `${rc.date.getFullYear()}-${String(rc.date.getMonth() + 1).padStart(2, "0")}`;
				if (!qdrByMonth[monthKey]) qdrByMonth[monthKey] = [];
				qdrByMonth[monthKey].push(rc.qdrValue);
			}

			const penaltiesByMonth = Object.entries(qdrByMonth)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([month, dailyValues]) => {
					const penalties =
						GasCalculationService.calculateMonthlyPenalties(
							dailyValues,
							penaltyParams,
						);
					return {
						month,
						pvema: penalties.pvema,
						pveme: penalties.pveme,
						sobredemanda: penalties.sobredemanda,
						total: penalties.total,
					};
				});

			// === 3. Monthly assertiveness trend ===
			const monthlyDays: Record<
				string,
				Map<string, { qdp: number; qdr: number }>
			> = {};

			for (const plan of plans) {
				const monthKey = `${plan.date.getFullYear()}-${String(plan.date.getMonth() + 1).padStart(2, "0")}`;
				const dateKey = plan.date.toISOString().split("T")[0] ?? "";
				if (!monthlyDays[monthKey])
					monthlyDays[monthKey] = new Map();
				const existing = monthlyDays[monthKey].get(dateKey) ?? {
					qdp: 0,
					qdr: 0,
				};
				existing.qdp += plan.qdpValue;
				monthlyDays[monthKey].set(dateKey, existing);
			}

			for (const rc of realConsumptions) {
				const monthKey = `${rc.date.getFullYear()}-${String(rc.date.getMonth() + 1).padStart(2, "0")}`;
				const dateKey = rc.date.toISOString().split("T")[0] ?? "";
				if (!monthlyDays[monthKey])
					monthlyDays[monthKey] = new Map();
				const existing = monthlyDays[monthKey].get(dateKey) ?? {
					qdp: 0,
					qdr: 0,
				};
				existing.qdr += rc.qdrValue;
				monthlyDays[monthKey].set(dateKey, existing);
			}

			const assertivenessTrend = Object.entries(monthlyDays)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([month, dayMap]) => {
					const days = Array.from(dayMap.values());
					const accuracy =
						GasCalculationService.calculateMonthlyAccuracy(
							days,
							contract.transportToleranceUpperPercent,
							contract.transportToleranceLowerPercent,
						);
					return {
						month,
						assertivenessRate: accuracy.assertivenessRate,
						averageAccuracyRate: accuracy.averageAccuracyRate,
						daysWithData: accuracy.daysWithData,
						daysWithinTolerance: accuracy.daysWithinTolerance,
					};
				});

			// === 4. Per-unit accuracy comparison ===
			const unitDayMaps: Record<
				string,
				Map<string, { qdp: number; qdr: number }>
			> = {};

			for (const plan of plans) {
				if (!unitDayMaps[plan.unitId])
					unitDayMaps[plan.unitId] = new Map();
				const dayMap = unitDayMaps[plan.unitId]!;
				const dateKey = plan.date.toISOString().split("T")[0] ?? "";
				const existing = dayMap.get(dateKey) ?? {
					qdp: 0,
					qdr: 0,
				};
				existing.qdp += plan.qdpValue;
				dayMap.set(dateKey, existing);
			}

			for (const rc of realConsumptions) {
				if (!unitDayMaps[rc.unitId])
					unitDayMaps[rc.unitId] = new Map();
				const dayMap = unitDayMaps[rc.unitId]!;
				const dateKey = rc.date.toISOString().split("T")[0] ?? "";
				const existing = dayMap.get(dateKey) ?? {
					qdp: 0,
					qdr: 0,
				};
				existing.qdr += rc.qdrValue;
				dayMap.set(dateKey, existing);
			}

			const unitComparison = Object.entries(unitDayMaps)
				.map(([uid, dayMap]) => {
					const unit = units.find((u) => u.id === uid);
					const days = Array.from(dayMap.values());
					const accuracy =
						GasCalculationService.calculateMonthlyAccuracy(
							days,
							contract.transportToleranceUpperPercent,
							contract.transportToleranceLowerPercent,
						);
					return {
						unitId: uid,
						unitCode: unit?.code ?? "",
						unitName: unit?.name ?? "",
						assertivenessRate: accuracy.assertivenessRate,
						averageAccuracyRate: accuracy.averageAccuracyRate,
						daysWithData: accuracy.daysWithData,
					};
				})
				.sort((a, b) => b.assertivenessRate - a.assertivenessRate);

			// === 5. Consumption by equipment type ===
			const consumptionByType: Record<string, number> = {};

			for (const entry of entries) {
				if (entry.qdcAtomizer > 0) {
					consumptionByType.atomizer =
						(consumptionByType.atomizer ?? 0) + entry.qdcAtomizer;
				}
				if (entry.qdcLines > 0) {
					consumptionByType.line =
						(consumptionByType.line ?? 0) + entry.qdcLines;
				}
			}

			const equipmentTypeDistribution = Object.entries(
				consumptionByType,
			).map(([type, totalConsumption]) => ({
				type,
				totalConsumption: Math.round(totalConsumption * 100) / 100,
			}));

			return {
				startMonth,
				endMonth,
				contract: {
					id: contract.id,
					name: contract.name,
					qdcContracted: contract.qdcContracted,
					transportToleranceUpperPercent:
						contract.transportToleranceUpperPercent,
					transportToleranceLowerPercent:
						contract.transportToleranceLowerPercent,
				},
				contracts: allContracts.map((c) => ({
					id: c.id,
					name: c.name,
					qdcContracted: c.qdcContracted,
				})),
				units: units.map((u) => ({
					id: u.id,
					code: u.code,
					name: u.name,
				})),
				consumptionByUnit,
				penaltiesByMonth,
				assertivenessTrend,
				unitComparison,
				equipmentTypeDistribution,
			};
		},
		{
			auth: true,
			query: t.Object({
				startMonth: t.String(),
				endMonth: t.String(),
				unitId: t.Optional(t.String()),
				contractId: t.Optional(t.String()),
			}),
		},
	)

	/**
	 * GET /gas/reports/dashboard/download
	 *
	 * Export the dashboard data as an Excel file.
	 */
	.get(
		"/reports/dashboard/download",
		async ({ query, status, session }) => {
			const { startMonth, endMonth, contractId } = query;

			const monthRegex = /^\d{4}-\d{2}$/;
			if (!monthRegex.test(startMonth) || !monthRegex.test(endMonth)) {
				return status(400, {
					error: "Invalid month format. Expected YYYY-MM",
				});
			}

			const startParts = startMonth.split("-").map(Number);
			const endParts = endMonth.split("-").map(Number);
			const startDate = new Date(
				startParts[0] ?? 0,
				(startParts[1] ?? 1) - 1,
				1,
			);
			const endDate = new Date(endParts[0] ?? 0, endParts[1] ?? 1, 0);

			const contract = contractId
				? await db.gasContract.findFirst({
						where: {
							id: contractId,
							organizationId: session.activeOrganizationId ?? undefined,
						},
					})
				: await db.gasContract.findFirst({
						where: {
							organizationId: session.activeOrganizationId ?? undefined,
							active: true,
							effectiveFrom: { lte: endDate },
							OR: [
								{ effectiveTo: null },
								{ effectiveTo: { gte: startDate } },
							],
						},
						orderBy: { effectiveFrom: "desc" },
					});

			if (!contract) {
				return status(404, { error: "No active contract found" });
			}

			const units = await db.gasUnit.findMany({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
				},
				orderBy: { code: "asc" },
			});

			const plans = await db.gasDailyPlan.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: { gte: startDate, lte: endDate },
				},
				include: { unit: true },
				orderBy: { date: "asc" },
			});

			const realConsumptions = await db.gasRealConsumption.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: { gte: startDate, lte: endDate },
				},
				include: { unit: true },
				orderBy: { date: "asc" },
			});

			const entries = await db.gasDailyEntry.findMany({
				where: {
					unit: {
						organizationId: session.activeOrganizationId ?? undefined,
					},
					date: { gte: startDate, lte: endDate },
				},
				orderBy: { date: "asc" },
			});

			// Build workbook
			const workbook = new ExcelJS.Workbook();

			// Sheet 1: Consumo por Unidade
			const consumoSheet = workbook.addWorksheet(
				"Consumo por Unidade",
			);
			consumoSheet.columns = [
				{ header: "Mês", key: "month", width: 15 },
				{ header: "Unidade", key: "unit", width: 20 },
				{ header: "QDP (m³)", key: "qdp", width: 15 },
				{ header: "QDR (m³)", key: "qdr", width: 15 },
				{ header: "Desvio (%)", key: "deviation", width: 15 },
			];

			// Group plans and consumptions by month+unit
			const monthlyByUnit: Record<
				string,
				Record<string, { qdp: number; qdr: number }>
			> = {};

			for (const plan of plans) {
				const mk = `${plan.date.getFullYear()}-${String(plan.date.getMonth() + 1).padStart(2, "0")}`;
				if (!monthlyByUnit[mk]) monthlyByUnit[mk] = {};
				if (!monthlyByUnit[mk][plan.unitId])
					monthlyByUnit[mk][plan.unitId] = { qdp: 0, qdr: 0 };
				const e = monthlyByUnit[mk][plan.unitId];
				if (e) e.qdp += plan.qdpValue;
			}

			for (const rc of realConsumptions) {
				const mk = `${rc.date.getFullYear()}-${String(rc.date.getMonth() + 1).padStart(2, "0")}`;
				if (!monthlyByUnit[mk]) monthlyByUnit[mk] = {};
				if (!monthlyByUnit[mk][rc.unitId])
					monthlyByUnit[mk][rc.unitId] = { qdp: 0, qdr: 0 };
				const e = monthlyByUnit[mk][rc.unitId];
				if (e) e.qdr += rc.qdrValue;
			}

			for (const [month, unitData] of Object.entries(
				monthlyByUnit,
			).sort(([a], [b]) => a.localeCompare(b))) {
				for (const [uid, values] of Object.entries(unitData)) {
					const unit = units.find((u) => u.id === uid);
					const deviation =
						values.qdp > 0
							? ((values.qdr - values.qdp) / values.qdp) * 100
							: 0;
					consumoSheet.addRow({
						month,
						unit: unit
							? `${unit.code} - ${unit.name}`
							: uid,
						qdp: Math.round(values.qdp * 100) / 100,
						qdr: Math.round(values.qdr * 100) / 100,
						deviation: Math.round(deviation * 100) / 100,
					});
				}
			}

			// Sheet 2: Penalidades
			const penaltyParams = {
				qdcContracted: contract.qdcContracted,
				pvemaTolerancePercent:
					contract.pvemaTolerancePercent ??
					contract.transportToleranceUpperPercent,
				pvemeTolerancePercent:
					contract.pvemeTolerancePercent ??
					contract.transportToleranceLowerPercent,
				overdemandTier1MaxPercent:
					contract.overdemandTier1MaxPercent ?? 110,
				overdemandTier2MaxPercent:
					contract.overdemandTier2MaxPercent ?? 115,
				overdemandTier2Multiplier:
					contract.overdemandTier2Multiplier ?? 1.0,
				overdemandTier3Multiplier:
					contract.overdemandTier3Multiplier ?? 1.5,
				tusdTariffPerUnit: contract.tusdTariffPerUnit ?? 0,
				basePricePerUnit: contract.basePricePerUnit ?? 0,
			};

			const penaltySheet = workbook.addWorksheet("Penalidades");
			penaltySheet.columns = [
				{ header: "Mês", key: "month", width: 15 },
				{ header: "PVEMA (R$)", key: "pvema", width: 15 },
				{ header: "PVEME (R$)", key: "pveme", width: 15 },
				{
					header: "Sobredemanda (R$)",
					key: "sobredemanda",
					width: 18,
				},
				{ header: "Total (R$)", key: "total", width: 15 },
			];

			const qdrByMonth: Record<string, number[]> = {};
			for (const rc of realConsumptions) {
				const mk = `${rc.date.getFullYear()}-${String(rc.date.getMonth() + 1).padStart(2, "0")}`;
				if (!qdrByMonth[mk]) qdrByMonth[mk] = [];
				qdrByMonth[mk].push(rc.qdrValue);
			}

			for (const [month, dailyValues] of Object.entries(
				qdrByMonth,
			).sort(([a], [b]) => a.localeCompare(b))) {
				const penalties =
					GasCalculationService.calculateMonthlyPenalties(
						dailyValues,
						penaltyParams,
					);
				penaltySheet.addRow({
					month,
					pvema: penalties.pvema,
					pveme: penalties.pveme,
					sobredemanda: penalties.sobredemanda,
					total: penalties.total,
				});
			}

			// Sheet 3: Assertividade
			const accuracySheet = workbook.addWorksheet("Assertividade");
			accuracySheet.columns = [
				{ header: "Mês", key: "month", width: 15 },
				{
					header: "Taxa Assertividade (%)",
					key: "assertiveness",
					width: 22,
				},
				{
					header: "Taxa Acurácia (%)",
					key: "accuracy",
					width: 20,
				},
				{
					header: "Dias com Dados",
					key: "daysWithData",
					width: 18,
				},
				{
					header: "Dias Dentro Tolerância",
					key: "daysWithinTolerance",
					width: 24,
				},
			];

			// Calculate assertiveness per month
			const monthlyDays: Record<
				string,
				Map<string, { qdp: number; qdr: number }>
			> = {};
			for (const plan of plans) {
				const mk = `${plan.date.getFullYear()}-${String(plan.date.getMonth() + 1).padStart(2, "0")}`;
				const dk = plan.date.toISOString().split("T")[0] ?? "";
				if (!monthlyDays[mk]) monthlyDays[mk] = new Map();
				const existing = monthlyDays[mk].get(dk) ?? {
					qdp: 0,
					qdr: 0,
				};
				existing.qdp += plan.qdpValue;
				monthlyDays[mk].set(dk, existing);
			}
			for (const rc of realConsumptions) {
				const mk = `${rc.date.getFullYear()}-${String(rc.date.getMonth() + 1).padStart(2, "0")}`;
				const dk = rc.date.toISOString().split("T")[0] ?? "";
				if (!monthlyDays[mk]) monthlyDays[mk] = new Map();
				const existing = monthlyDays[mk].get(dk) ?? {
					qdp: 0,
					qdr: 0,
				};
				existing.qdr += rc.qdrValue;
				monthlyDays[mk].set(dk, existing);
			}

			for (const [month, dayMap] of Object.entries(
				monthlyDays,
			).sort(([a], [b]) => a.localeCompare(b))) {
				const days = Array.from(dayMap.values());
				const accuracy =
					GasCalculationService.calculateMonthlyAccuracy(
						days,
						contract.transportToleranceUpperPercent,
						contract.transportToleranceLowerPercent,
					);
				accuracySheet.addRow({
					month,
					assertiveness: accuracy.assertivenessRate,
					accuracy: accuracy.averageAccuracyRate,
					daysWithData: accuracy.daysWithData,
					daysWithinTolerance: accuracy.daysWithinTolerance,
				});
			}

			// Sheet 4: Consumo por Tipo
			const typeSheet = workbook.addWorksheet(
				"Consumo por Tipo",
			);
			typeSheet.columns = [
				{
					header: "Tipo de Equipamento",
					key: "type",
					width: 25,
				},
				{
					header: "Consumo Total (m³)",
					key: "consumption",
					width: 20,
				},
			];

			const typeLabels: Record<string, string> = {
				atomizer: "Atomizador",
				line: "Linha de Produção",
				dryer: "Secador",
			};

			const consumptionByType: Record<string, number> = {};
			for (const entry of entries) {
				if (entry.qdcAtomizer > 0) {
					consumptionByType.atomizer =
						(consumptionByType.atomizer ?? 0) +
						entry.qdcAtomizer;
				}
				if (entry.qdcLines > 0) {
					consumptionByType.line =
						(consumptionByType.line ?? 0) + entry.qdcLines;
				}
			}

			for (const [type, totalConsumption] of Object.entries(
				consumptionByType,
			)) {
				typeSheet.addRow({
					type: typeLabels[type] ?? type,
					consumption:
						Math.round(totalConsumption * 100) / 100,
				});
			}

			// Style headers
			for (const sheet of [
				consumoSheet,
				penaltySheet,
				accuracySheet,
				typeSheet,
			]) {
				const headerRow = sheet.getRow(1);
				headerRow.font = { bold: true };
				headerRow.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: "FFE2E8F0" },
				};
			}

			// Generate buffer and return
			const buffer = await workbook.xlsx.writeBuffer();
			const filename = `Dashboard_${startMonth}_${endMonth}.xlsx`;

			return new Response(buffer as ArrayBuffer, {
				headers: {
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		},
		{
			auth: true,
			query: t.Object({
				startMonth: t.String(),
				endMonth: t.String(),
				contractId: t.Optional(t.String()),
			}),
		},
	)

	/**
	 * GET /gas/audit-log/export
	 *
	 * Exports audit logs to Excel (XLSX) with filters.
	 */
	.get(
		"/audit-log/export",
		async ({ query, session }) => {
			const where: Record<string, unknown> = {
				organizationId: session.activeOrganizationId,
			};

			if (query.startDate && query.endDate) {
				where.createdAt = {
					gte: new Date(query.startDate),
					lte: new Date(query.endDate),
				};
			}
			if (query.entityType) where.entityType = query.entityType;
			if (query.action) where.action = query.action;
			if (query.userId) where.userId = query.userId;

			const logs = await db.gasAuditLog.findMany({
				where,
				orderBy: { createdAt: "desc" },
			});

			const workbook = new ExcelJS.Workbook();
			const sheet = workbook.addWorksheet("Audit Log");

			sheet.columns = [
				{ header: "Data/Hora", key: "createdAt", width: 22 },
				{ header: "Usuário", key: "userName", width: 25 },
				{ header: "E-mail", key: "userEmail", width: 30 },
				{ header: "Tipo de Entidade", key: "entityType", width: 18 },
				{ header: "Nome da Entidade", key: "entityName", width: 30 },
				{ header: "Ação", key: "action", width: 14 },
				{ header: "Campo", key: "field", width: 20 },
				{ header: "Valor Anterior", key: "oldValue", width: 30 },
				{ header: "Novo Valor", key: "newValue", width: 30 },
				{ header: "Alterações", key: "changes", width: 40 },
			];

			const entityTypeLabels: Record<string, string> = {
				session: "Sessão",
				contract: "Contrato",
				unit: "Unidade",
				plan: "Programação",
				consumption: "Consumo",
				parameter: "Parâmetro",
				template: "Template",
				custom_field: "Campo Personalizado",
				alert: "Alerta",
				user: "Usuário",
				organization: "Organização",
			};

			const actionLabels: Record<string, string> = {
				create: "Criação",
				update: "Atualização",
				delete: "Exclusão",
				login: "Login",
				logout: "Logout",
			};

			for (const log of logs) {
				sheet.addRow({
					createdAt: log.createdAt instanceof Date
						? log.createdAt.toLocaleString("pt-BR")
						: new Date(log.createdAt).toLocaleString("pt-BR"),
					userName: log.userName ?? "Sistema",
					userEmail: log.userEmail ?? "-",
					entityType: entityTypeLabels[log.entityType] ?? log.entityType,
					entityName: log.entityName ?? "-",
					action: actionLabels[log.action] ?? log.action,
					field: log.field ?? "-",
					oldValue: log.oldValue ?? "-",
					newValue: log.newValue ?? "-",
					changes: log.changes ?? "-",
				});
			}

			// Style header row
			const headerRow = sheet.getRow(1);
			headerRow.font = { bold: true };
			headerRow.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFE2E8F0" },
			};

			const buffer = await workbook.xlsx.writeBuffer();
			const filename = `audit-log-${new Date().toISOString().split("T")[0]}.xlsx`;

			return new Response(buffer as ArrayBuffer, {
				headers: {
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		},
		{
			auth: true,
			query: t.Object({
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				entityType: t.Optional(t.String()),
				action: t.Optional(t.String()),
				userId: t.Optional(t.String()),
			}),
		},
	);
