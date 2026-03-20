import type { db as Db } from "@acme/zen-v3";
import type { CoreContext } from "./core";

export interface UnitRefs {
	criciumaUnit: { id: string; code: string };
	joinvilleUnit: { id: string; code: string };
	blumenauUnit: { id: string; code: string };
	criciumaAtomizer: { id: string };
	criciumaLines: { id: string; name: string }[];
	joinvilleAtomizer: { id: string };
	joinvilleLines: { id: string; name: string }[];
	blumenauAtm250: { id: string };
	blumenauAtm052: { id: string };
	blumenauLines: { id: string; name: string }[];
	blumenauDryer: { id: string };
}

export async function seedGasUnits(
	db: typeof Db,
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	ctx: CoreContext,
): Promise<UnitRefs> {
	console.log("🌱 Seeding gas units and equipment...");

	// Units
	console.log("📍 Creating units...");

	const criciumaUnit = await userDb.gasUnit.create({
		data: {
			code: "CRI",
			name: "Criciúma",
			description: "Unidade de Criciúma - SC",
			address: "Rua Cel. Pedro Benedet, 1120",
			city: "Criciúma",
			state: "SC",
			zipCode: "88801-250",
			responsibleEmails: ["operacao.cri@empresa.com.br", "supervisor.cri@empresa.com.br"],
			active: true,
			organizationId: ctx.org.id,
		},
	});

	const joinvilleUnit = await userDb.gasUnit.create({
		data: {
			code: "JOI",
			name: "Joinville",
			description: "Unidade de Joinville - SC",
			address: "Av. Santos Dumont, 4500",
			city: "Joinville",
			state: "SC",
			zipCode: "89221-005",
			responsibleEmails: ["operacao.joi@empresa.com.br"],
			active: true,
			organizationId: ctx.org.id,
		},
	});

	const blumenauUnit = await userDb.gasUnit.create({
		data: {
			code: "BLU",
			name: "Blumenau",
			description: "Unidade de Blumenau - SC",
			address: "Rua 7 de Setembro, 2300",
			city: "Blumenau",
			state: "SC",
			zipCode: "89010-200",
			responsibleEmails: ["operacao.blu@empresa.com.br", "supervisor.blu@empresa.com.br"],
			active: true,
			organizationId: ctx.org.id,
		},
	});

	console.log("✅ Units created:", criciumaUnit.code, joinvilleUnit.code, blumenauUnit.code);

	// Criciúma Equipment
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

	const criciumaLines: { id: string; name: string }[] = [];
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

	// Joinville Equipment
	console.log("⚙️ Creating Joinville equipment...");

	const joinvilleAtomizer = await db.gasEquipment.create({
		data: {
			unitId: joinvilleUnit.id,
			code: "ATM-JOI",
			name: "Atomizador",
			type: "atomizer",
			active: true,
			orderIndex: 0,
		},
	});

	const joinvilleLines: { id: string; name: string }[] = [];
	for (let i = 1; i <= 2; i++) {
		const line = await db.gasEquipment.create({
			data: {
				unitId: joinvilleUnit.id,
				code: `L${i}-JOI`,
				name: `Linha ${i}`,
				type: "line",
				active: true,
				orderIndex: i,
			},
		});
		joinvilleLines.push(line);
	}

	// Blumenau Equipment
	console.log("⚙️ Creating Blumenau equipment...");

	const blumenauAtm250 = await db.gasEquipment.create({
		data: {
			unitId: blumenauUnit.id,
			code: "ATM-250",
			name: "ATM 250",
			type: "atomizer",
			active: true,
			orderIndex: 0,
		},
	});

	const blumenauAtm052 = await db.gasEquipment.create({
		data: {
			unitId: blumenauUnit.id,
			code: "ATM-052",
			name: "ATM 052",
			type: "atomizer",
			active: true,
			orderIndex: 1,
		},
	});

	const blumenauLines: { id: string; name: string }[] = [];
	for (let i = 1; i <= 2; i++) {
		const line = await db.gasEquipment.create({
			data: {
				unitId: blumenauUnit.id,
				code: `L${i}-BLU`,
				name: `Linha ${i}`,
				type: "line",
				active: true,
				orderIndex: i + 1,
			},
		});
		blumenauLines.push(line);
	}

	const blumenauDryer = await db.gasEquipment.create({
		data: {
			unitId: blumenauUnit.id,
			code: "SEC-2",
			name: "Secador 2",
			type: "dryer",
			active: true,
			orderIndex: 4,
		},
	});

	console.log("✅ Equipment created");

	// Equipment Constants
	console.log("📊 Creating equipment constants...");

	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: criciumaAtomizer.id,
			consumptionRate: 1500,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão do atomizador Criciúma",
		},
	});

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

	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: joinvilleAtomizer.id,
			consumptionRate: 1200,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão do atomizador Joinville",
		},
	});

	for (const line of joinvilleLines) {
		await db.gasEquipmentConstant.create({
			data: {
				equipmentId: line.id,
				consumptionRate: 200,
				consumptionUnit: "m3_per_hour",
				notes: `Taxa de consumo padrão ${line.name}`,
			},
		});
	}

	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: blumenauAtm250.id,
			consumptionRate: 2500,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão ATM 250",
		},
	});

	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: blumenauAtm052.id,
			consumptionRate: 520,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão ATM 052",
		},
	});

	for (const line of blumenauLines) {
		await db.gasEquipmentConstant.create({
			data: {
				equipmentId: line.id,
				consumptionRate: 300,
				consumptionUnit: "m3_per_hour",
				notes: `Taxa de consumo padrão ${line.name}`,
			},
		});
	}

	await db.gasEquipmentConstant.create({
		data: {
			equipmentId: blumenauDryer.id,
			consumptionRate: 800,
			consumptionUnit: "m3_per_hour",
			notes: "Taxa de consumo padrão Secador 2",
		},
	});

	console.log("✅ Equipment constants created");

	// Operator assignments: User B → all 3 units
	if (ctx.bUserMemberId) {
		console.log("👷 Assigning User B (operator) to all units...");
		await userDb.gasUnitOperator.create({
			data: {
				memberId: ctx.bUserMemberId,
				unitId: criciumaUnit.id,
				notes: "Operador responsável pela unidade de Criciúma",
			},
		});
		await userDb.gasUnitOperator.create({
			data: {
				memberId: ctx.bUserMemberId,
				unitId: joinvilleUnit.id,
				notes: "Operador responsável pela unidade de Joinville",
			},
		});
		await userDb.gasUnitOperator.create({
			data: {
				memberId: ctx.bUserMemberId,
				unitId: blumenauUnit.id,
				notes: "Operador responsável pela unidade de Blumenau",
			},
		});
		console.log("✅ Operator assignments created");
	}

	return {
		criciumaUnit,
		joinvilleUnit,
		blumenauUnit,
		criciumaAtomizer,
		criciumaLines,
		joinvilleAtomizer,
		joinvilleLines,
		blumenauAtm250,
		blumenauAtm052,
		blumenauLines,
		blumenauDryer,
	};
}
