import { authDb, db } from "@acme/zen-v3";
import { Elysia, t } from "elysia";
import ExcelJS from "exceljs";

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
										})
									),
								})
							),
						})
					),
				}),
			},
		}
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

			// Get active contract
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

					const qds = entry
						? (entry.qdsManual ?? entry.qdsCalculated)
						: 0;
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
						transportToleranceUpperPercent: contract.transportToleranceUpperPercent,
						transportToleranceLowerPercent: contract.transportToleranceLowerPercent,
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
					transportToleranceUpperPercent: contract.transportToleranceUpperPercent,
					transportToleranceLowerPercent: contract.transportToleranceLowerPercent,
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

			// Get active contract
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
				{ header: "Lim. Sup. Transporte (m³)", key: "transportUpper", width: 20 },
				{ header: "Lim. Inf. Transporte (m³)", key: "transportLower", width: 20 },
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
						transportToleranceUpperPercent: contract.transportToleranceUpperPercent,
						transportToleranceLowerPercent: contract.transportToleranceLowerPercent,
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
			set.headers["Content-Disposition"] =
				`attachment; filename="${filename}"`;

			return buffer;
		},
		{
			auth: true,
			query: t.Object({
				month: t.String(),
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
	);
