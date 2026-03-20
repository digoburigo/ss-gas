import type { db as Db } from "@acme/zen-v3";
import type { CoreContext } from "./core";
import type { UnitRefs } from "./gas-units";
import { getDateRange, randomVariation, selectWeightedCause } from "./utils";

/**
 * Determines the deviation pattern for a specific day index within the 90-day range.
 *
 * Returns a multiplier to apply to QDP to get QDR, plus an optional cause note.
 * - Oldest month (days 0-29): high accuracy, most within 5%
 * - Middle month (days 30-59): mixed, some 10-15% deviations
 * - Recent month (days 60-89): includes poor accuracy days (20-30%) mixed with good
 *
 * Specific days are overridden to guarantee threshold crossings:
 * - ~5 days/month with >15% deviation (crosses deviation_threshold_percent)
 * - ~2 days/month with >25% deviation (crosses critical_deviation_threshold_percent)
 */
function getDeviationPattern(
	dayIndex: number,
	qdpValue: number,
): { qdrValue: number; notes: string | null } {
	const month = Math.floor(dayIndex / 30); // 0 = oldest, 1 = middle, 2 = recent

	// Intentional high-deviation days per month (fixed day-of-month offsets)
	// ~5 days with >15% and ~2 of those with >25%
	const criticalDays = [3, 17]; // >25% deviation
	const warningDays = [7, 12, 24]; // >15% but <25% deviation
	const dayOfMonth = dayIndex % 30;

	if (criticalDays.includes(dayOfMonth)) {
		// >25% deviation — critical threshold crossing
		const direction = dayOfMonth % 2 === 0 ? 1 : -1;
		const deviation = 0.26 + Math.random() * 0.08; // 26-34%
		const multiplier = 1 + direction * deviation;
		const cause = selectWeightedCause();
		return {
			qdrValue: Math.round(qdpValue * multiplier),
			notes: `CAUSE:${cause}|Desvio crítico - ${direction > 0 ? "sobre-demanda" : "sub-consumo"} significativo`,
		};
	}

	if (warningDays.includes(dayOfMonth)) {
		// 15-25% deviation — warning threshold crossing
		const direction = dayOfMonth % 2 === 0 ? 1 : -1;
		const deviation = 0.16 + Math.random() * 0.08; // 16-24%
		const multiplier = 1 + direction * deviation;
		const cause = selectWeightedCause();
		return {
			qdrValue: Math.round(qdpValue * multiplier),
			notes: `CAUSE:${cause}|Desvio de transporte registrado`,
		};
	}

	// Normal days — accuracy varies by month
	if (month === 0) {
		// Oldest month: high accuracy (within 5%)
		const multiplier = 0.97 + Math.random() * 0.06; // 97-103%
		return { qdrValue: Math.round(qdpValue * multiplier), notes: null };
	}

	if (month === 1) {
		// Middle month: mixed accuracy (some 10-15% deviations)
		const roll = Math.random();
		if (roll < 0.3) {
			// 30% chance of moderate deviation
			const direction = Math.random() > 0.5 ? 1 : -1;
			const deviation = 0.08 + Math.random() * 0.06; // 8-14%
			const multiplier = 1 + direction * deviation;
			const cause = selectWeightedCause();
			return {
				qdrValue: Math.round(qdpValue * multiplier),
				notes: `CAUSE:${cause}|Desvio de molécula registrado`,
			};
		}
		const multiplier = 0.96 + Math.random() * 0.08; // 96-104%
		return { qdrValue: Math.round(qdpValue * multiplier), notes: null };
	}

	// Recent month: a few poor accuracy days mixed with good
	const roll = Math.random();
	if (roll < 0.2) {
		// 20% chance of poor accuracy (but not exceeding thresholds — those are handled above)
		const direction = Math.random() > 0.5 ? 1 : -1;
		const deviation = 0.08 + Math.random() * 0.06; // 8-14%
		const multiplier = 1 + direction * deviation;
		const cause = selectWeightedCause();
		return {
			qdrValue: Math.round(qdpValue * multiplier),
			notes: `CAUSE:${cause}|Desvio registrado`,
		};
	}
	const multiplier = 0.97 + Math.random() * 0.06; // 97-103%
	return { qdrValue: Math.round(qdpValue * multiplier), notes: null };
}

export async function seedGasDailyData(
	db: typeof Db,
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	refs: UnitRefs,
	ctx: CoreContext,
): Promise<void> {
	console.log("📅 Generating daily entries for the last 90 days...");

	const dates = getDateRange(90);

	// Plans older than 7 days will be seeded as approved
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
	sevenDaysAgo.setHours(0, 0, 0, 0);

	const unitConfigs = [
		{
			unit: refs.criciumaUnit,
			atomizers: [{ equipment: refs.criciumaAtomizer, rate: 1500 }],
			lines: refs.criciumaLines.map((line) => ({ equipment: line, rate: 250 })),
			dryer: null as { equipment: { id: string }; rate: number } | null,
			typicalQds: { min: 45000, max: 55000 },
		},
		{
			unit: refs.joinvilleUnit,
			atomizers: [{ equipment: refs.joinvilleAtomizer, rate: 1200 }],
			lines: refs.joinvilleLines.map((line) => ({ equipment: line, rate: 200 })),
			dryer: null as { equipment: { id: string }; rate: number } | null,
			typicalQds: { min: 25000, max: 35000 },
		},
		{
			unit: refs.blumenauUnit,
			atomizers: [
				{ equipment: refs.blumenauAtm250, rate: 2500 },
				{ equipment: refs.blumenauAtm052, rate: 520 },
			],
			lines: refs.blumenauLines.map((line) => ({ equipment: line, rate: 300 })),
			dryer: { equipment: refs.blumenauDryer, rate: 800 },
			typicalQds: { min: 55000, max: 70000 },
		},
	];

	let totalEntries = 0;
	let totalLineStatuses = 0;
	let totalPlans = 0;
	let totalApprovedPlans = 0;
	let totalConsumptions = 0;

	for (const config of unitConfigs) {
		console.log(`   Processing unit: ${config.unit.code}...`);

		for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
			const date = dates[dayIndex] as Date;
			const atomizerScheduled = Math.random() > 0.1;
			const atomizerHours = atomizerScheduled
				? 16 + Math.floor(Math.random() * 8)
				: 0;

			let qdcAtomizer = 0;
			if (atomizerScheduled) {
				for (const atomizer of config.atomizers) {
					qdcAtomizer += atomizer.rate * atomizerHours;
				}
			}

			let qdcLines = 0;
			const lineStatuses: { equipmentId: string; status: "on" | "off" }[] = [];

			for (const line of config.lines) {
				const isOn = Math.random() > 0.3;
				lineStatuses.push({
					equipmentId: line.equipment.id,
					status: isOn ? "on" : "off",
				});
				if (isOn) {
					const lineHours = 18 + Math.floor(Math.random() * 6);
					qdcLines += line.rate * lineHours;
				}
			}

			let qdcDryer = 0;
			if (config.dryer) {
				const dryerOn = Math.random() > 0.4;
				if (dryerOn) {
					const dryerHours = 12 + Math.floor(Math.random() * 12);
					qdcDryer = config.dryer.rate * dryerHours;
				}
			}

			const baseQds = qdcAtomizer + qdcLines + qdcDryer;
			const qdsCalculated = Math.round(randomVariation(baseQds, 5));

			const entry = await userDb.gasDailyEntry.create({
				data: {
					unitId: config.unit.id,
					date,
					atomizerScheduled,
					atomizerHours,
					qdcAtomizer: Math.round(qdcAtomizer),
					qdcLines: Math.round(qdcLines),
					qdsCalculated,
				},
			});
			totalEntries++;

			for (const lineStatus of lineStatuses) {
				await db.gasLineStatus.create({
					data: {
						entryId: entry.id,
						equipmentId: lineStatus.equipmentId,
						status: lineStatus.status,
					},
				});
				totalLineStatuses++;
			}

			const skipQdp = Math.random() < 0.05;
			let qdpValue: number | null = null;

			if (!skipQdp) {
				qdpValue = Math.round(qdsCalculated * (0.95 + Math.random() * 0.1));

				// Plans older than 7 days are seeded as approved (simulates real approval workflow)
				const isOldPlan = date < sevenDaysAgo;
				const approvalDate = isOldPlan
					? new Date(date.getTime() + 4 * 60 * 60 * 1000) // 4h after the plan date
					: undefined;

				await userDb.gasDailyPlan.create({
					data: {
						unitId: config.unit.id,
						date,
						qdpValue,
						submitted: true,
						...(isOldPlan && {
							approved: true,
							approvedAt: approvalDate,
							approvedById: ctx.user.id,
						}),
					},
				});
				totalPlans++;
				if (isOldPlan) totalApprovedPlans++;
			}

			const skipQdr = Math.random() < 0.05;

			if (!skipQdr && qdpValue !== null) {
				const { qdrValue, notes } = getDeviationPattern(dayIndex, qdpValue);

				await userDb.gasRealConsumption.create({
					data: {
						unitId: config.unit.id,
						date,
						qdrValue,
						source: "meter",
						notes,
					},
				});
				totalConsumptions++;
			}
		}
	}

	console.log("✅ Daily data generated");

	console.log("\n📋 Summary:");
	console.log("   Units: 3 (CRI, JOI, BLU)");
	console.log("   Equipment:");
	console.log("     - Criciúma: 1 atomizer + 8 lines (0-7)");
	console.log("     - Joinville: 1 atomizer + 2 lines (1-2)");
	console.log("     - Blumenau: 2 atomizers + 2 lines + 1 dryer");
	console.log("   Contracts: 2 (CTG-2024-001 main + CTG-2025-002 secondary)");
	console.log("   Daily Data (90 days):");
	console.log(`     - GasDailyEntry: ${totalEntries} records`);
	console.log(`     - GasLineStatus: ${totalLineStatuses} records`);
	console.log(`     - GasDailyPlan: ${totalPlans} records (${totalApprovedPlans} approved)`);
	console.log(`     - GasRealConsumption: ${totalConsumptions} records`);
}
