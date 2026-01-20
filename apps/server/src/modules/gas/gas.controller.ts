import { authDb, db } from "@acme/zen-v3";
import { Elysia, t } from "elysia";

import { betterAuth } from "../../plugins/better-auth";
import { GasCalculationService } from "./gas.service";

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

			// Parse date
			const entryDate = new Date(body.date);

			// Check if entry already exists for this unit and date
			const existingEntry = await db.gasDailyEntry.findFirst({
				where: {
					unitId,
					date: entryDate,
				},
			});

			if (existingEntry) {
				return status(409, {
					error: "Entry already exists for this date",
					existingEntryId: existingEntry.id,
				});
			}

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

			// Create the entry with calculated values
			const entry = await userDb.gasDailyEntry.create({
				data: {
					unitId,
					date: entryDate,
					atomizerScheduled: body.atomizerScheduled ?? true,
					atomizerHours: body.atomizerHours ?? 0,
					secondaryAtomizerScheduled: body.secondaryAtomizerScheduled,
					secondaryAtomizerHours: body.secondaryAtomizerHours,
					qdcAtomizer,
					qdcLines,
					qdsCalculated,
					qdsManual: body.qdsManual,
					observations: body.observations,
				},
			});

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

			// Return entry with line statuses
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
				409: t.Object({
					error: t.String(),
					existingEntryId: t.String(),
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
			const contract = await db.gasContract.findFirst({
				where: {
					organizationId: session.activeOrganizationId ?? undefined,
					active: true,
					effectiveFrom: { lte: endDate },
					OR: [{ effectiveTo: null }, { effectiveTo: { gte: startDate } }],
				},
				orderBy: { effectiveFrom: "desc" },
			});

			if (!contract) {
				return status(404, { error: "No active contract found" });
			}

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
						transportToleranceUpperPercent: contract.transportToleranceUpperPercent,
						transportToleranceLowerPercent: contract.transportToleranceLowerPercent,
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
					transportToleranceUpperPercent: contract.transportToleranceUpperPercent,
					transportToleranceLowerPercent: contract.transportToleranceLowerPercent,
					moleculeTolerancePercent: contract.moleculeTolerancePercent,
				},
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
	);
