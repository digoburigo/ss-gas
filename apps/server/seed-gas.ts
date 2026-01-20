import { authDb, db } from "@acme/zen-v3";

async function main() {
	console.log("🔥 Clearing gas tables...");

	await db.gasEquipmentConstant.deleteMany();
	await db.gasLineStatus.deleteMany();
	await db.gasDailyEntry.deleteMany();
	await db.gasDailyPlan.deleteMany();
	await db.gasRealConsumption.deleteMany();
	await db.gasEquipment.deleteMany();
	await db.gasUnit.deleteMany();
	await db.gasContract.deleteMany();

	console.log("🌱 Seeding gas units and equipment...");

	// Get the first organization to associate data with
	const org = await db.organization.findFirst();
	if (!org) {
		console.error("❌ No organization found. Please run seed.ts first.");
		process.exit(1);
	}

	// Get the first user to associate data with
	const user = await db.user.findFirst();
	if (!user) {
		console.error("❌ No user found. Please run seed.ts first.");
		process.exit(1);
	}

	const userDb = authDb.$setAuth({
		userId: user.id,
		organizationId: org.id,
		organizationRole: "admin",
		role: "admin",
	});

	// Create Units
	console.log("📍 Creating units...");

	const criciumaUnit = await userDb.gasUnit.create({
		data: {
			code: "CRI",
			name: "Criciúma",
			description: "Unidade de Criciúma - SC",
			active: true,
			organizationId: org.id,
		},
	});

	const urussangaUnit = await userDb.gasUnit.create({
		data: {
			code: "URU",
			name: "Urussanga",
			description: "Unidade de Urussanga - SC",
			active: true,
			organizationId: org.id,
		},
	});

	const botucatuUnit = await userDb.gasUnit.create({
		data: {
			code: "BOT",
			name: "Botucatu",
			description: "Unidade de Botucatu - SP",
			active: true,
			organizationId: org.id,
		},
	});

	console.log("✅ Units created:", criciumaUnit.code, urussangaUnit.code, botucatuUnit.code);

	// Criciúma Equipment: Atomizador + Lines 0-7
	console.log("⚙️ Creating Criciúma equipment...");

	const criciumaAtomizer = await db.gasEquipment.create({
		data: {
			unitId: criciumaUnit.id,
			code: "ATM-CRI",
			name: "Atomizador",
			type: "atomizer",
			active: true,
			orderIndex: 0,
		},
	});

	const criciumaLines = [];
	for (let i = 0; i <= 7; i++) {
		const line = await db.gasEquipment.create({
			data: {
				unitId: criciumaUnit.id,
				code: `L${i}-CRI`,
				name: `Linha ${i}`,
				type: "line",
				active: true,
				orderIndex: i + 1,
			},
		});
		criciumaLines.push(line);
	}

	// Urussanga Equipment: Atomizador + Lines 1-2
	console.log("⚙️ Creating Urussanga equipment...");

	const urussangaAtomizer = await db.gasEquipment.create({
		data: {
			unitId: urussangaUnit.id,
			code: "ATM-URU",
			name: "Atomizador",
			type: "atomizer",
			active: true,
			orderIndex: 0,
		},
	});

	const urussangaLines = [];
	for (let i = 1; i <= 2; i++) {
		const line = await db.gasEquipment.create({
			data: {
				unitId: urussangaUnit.id,
				code: `L${i}-URU`,
				name: `Linha ${i}`,
				type: "line",
				active: true,
				orderIndex: i,
			},
		});
		urussangaLines.push(line);
	}

	// Botucatu Equipment: ATM 250, ATM 052, Lines 1-2, Secador 2
	console.log("⚙️ Creating Botucatu equipment...");

	const botucatuAtm250 = await db.gasEquipment.create({
		data: {
			unitId: botucatuUnit.id,
			code: "ATM-250",
			name: "ATM 250",
			type: "atomizer",
			active: true,
			orderIndex: 0,
		},
	});

	const botucatuAtm052 = await db.gasEquipment.create({
		data: {
			unitId: botucatuUnit.id,
			code: "ATM-052",
			name: "ATM 052",
			type: "atomizer",
			active: true,
			orderIndex: 1,
		},
	});

	const botucatuLines = [];
	for (let i = 1; i <= 2; i++) {
		const line = await db.gasEquipment.create({
			data: {
				unitId: botucatuUnit.id,
				code: `L${i}-BOT`,
				name: `Linha ${i}`,
				type: "line",
				active: true,
				orderIndex: i + 1,
			},
		});
		botucatuLines.push(line);
	}

	const botucatuDryer = await db.gasEquipment.create({
		data: {
			unitId: botucatuUnit.id,
			code: "SEC-2",
			name: "Secador 2",
			type: "dryer",
			active: true,
			orderIndex: 4,
		},
	});

	console.log("✅ Equipment created");

	// Create Equipment Constants with consumption rates
	console.log("📊 Creating equipment constants...");

	// Criciúma Atomizer: 1,500 m³/h
	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: criciumaAtomizer.id,
			consumptionRate: 1500,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão do atomizador Criciúma",
		},
	});

	// Criciúma Lines: 250 m³/h each
	for (const line of criciumaLines) {
		await db.gasEquipmentConstant.create({
			data: {
				equipmentId: line.id,
				consumptionRate: 250,
				consumptionUnit: "m3_per_hour",
				notes: `Taxa de consumo padrão ${line.name}`,
			},
		});
	}

	// Urussanga Atomizer: 1,200 m³/h
	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: urussangaAtomizer.id,
			consumptionRate: 1200,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão do atomizador Urussanga",
		},
	});

	// Urussanga Lines: 200 m³/h each
	for (const line of urussangaLines) {
		await db.gasEquipmentConstant.create({
			data: {
				equipmentId: line.id,
				consumptionRate: 200,
				consumptionUnit: "m3_per_hour",
				notes: `Taxa de consumo padrão ${line.name}`,
			},
		});
	}

	// Botucatu ATM 250: 2,500 m³/h
	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: botucatuAtm250.id,
			consumptionRate: 2500,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão ATM 250",
		},
	});

	// Botucatu ATM 052: 520 m³/h
	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: botucatuAtm052.id,
			consumptionRate: 520,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão ATM 052",
		},
	});

	// Botucatu Lines: 300 m³/h each
	for (const line of botucatuLines) {
		await db.gasEquipmentConstant.create({
			data: {
				equipmentId: line.id,
				consumptionRate: 300,
				consumptionUnit: "m3_per_hour",
				notes: `Taxa de consumo padrão ${line.name}`,
			},
		});
	}

	// Botucatu Secador 2: 800 m³/h
	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: botucatuDryer.id,
			consumptionRate: 800,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão Secador 2",
		},
	});

	console.log("✅ Equipment constants created");

	// Create Default Contract
	console.log("📜 Creating default contract...");

	await userDb.gasContract.create({
		data: {
			name: "Contrato Principal de Gás Natural",
			qdcContracted: 134800, // 134,800 m³/d
			transportToleranceUpperPercent: 10, // +10%
			transportToleranceLowerPercent: 20, // -20%
			moleculeTolerancePercent: 5, // ±5%
			active: true,
			notes: "Contrato principal com tolerâncias padrão de transporte e molécula",
			organizationId: org.id,
		},
	});

	console.log("✅ Default contract created");

	console.log("🎉 Gas database seeded successfully!");

	// Summary
	console.log("\n📋 Summary:");
	console.log("   Units: 3 (CRI, URU, BOT)");
	console.log("   Equipment:");
	console.log("     - Criciúma: 1 atomizer + 8 lines (0-7)");
	console.log("     - Urussanga: 1 atomizer + 2 lines (1-2)");
	console.log("     - Botucatu: 2 atomizers + 2 lines + 1 dryer");
	console.log("   Contract: QDC 134,800 m³/d with tolerance bands");

	process.exit(0);
}

main().catch((error) => {
	console.error("❌ Seed failed:", error);
	process.exit(1);
});
