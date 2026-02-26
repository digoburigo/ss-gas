import type { db as Db } from "@acme/zen-v3";
import type { CoreContext } from "./core";
import type { UnitRefs } from "./gas-units";
import { getDateRange, randomVariation, selectWeightedCause } from "./utils";

export async function seedGasDailyData(
	db: typeof Db,
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	refs: UnitRefs,
	ctx: CoreContext,
): Promise<void> {
	console.log("📅 Generating daily entries for the last 45 days...");

	const dates = getDateRange(45);

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

		for (const date of dates) {
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
				const deviationRoll = Math.random();
				let qdrValue: number;
				let notes: string | null = null;

				if (deviationRoll < 0.7) {
					qdrValue = Math.round(qdpValue * (0.92 + Math.random() * 0.16));
				} else if (deviationRoll < 0.9) {
					if (Math.random() > 0.5) {
						qdrValue = Math.round(qdpValue * (1.12 + Math.random() * 0.15));
					} else {
						qdrValue = Math.round(qdpValue * (0.6 + Math.random() * 0.18));
					}
					notes = `CAUSE:${selectWeightedCause()}|Desvio de transporte registrado`;
				} else {
					if (Math.random() > 0.5) {
						qdrValue = Math.round(qdpValue * (1.06 + Math.random() * 0.04));
					} else {
						qdrValue = Math.round(qdpValue * (0.86 + Math.random() * 0.08));
					}
					notes = `CAUSE:${selectWeightedCause()}|Desvio de molécula registrado`;
				}

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
	console.log("   Daily Data (45 days):");
	console.log(`     - GasDailyEntry: ${totalEntries} records`);
	console.log(`     - GasLineStatus: ${totalLineStatuses} records`);
	console.log(`     - GasDailyPlan: ${totalPlans} records (${totalApprovedPlans} approved)`);
	console.log(`     - GasRealConsumption: ${totalConsumptions} records`);
}
