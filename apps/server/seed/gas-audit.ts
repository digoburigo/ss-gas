import type { db as Db } from "@acme/zen-v3";
import type { ContractRefs } from "./gas-contracts";
import type { CoreContext } from "./core";
import type { UnitRefs } from "./gas-units";

interface AuditEntry {
	entityType: string;
	entityId: string;
	entityName: string | null;
	action: "create" | "update" | "delete" | "login" | "logout";
	field: string | null;
	oldValue: string | null;
	newValue: string | null;
	changes: string | null;
	userId: string | null;
	userName: string | null;
	userEmail: string | null;
	organizationId: string;
	metadata: string | null;
	createdAt: Date;
}

const USERS = [
	{ name: "User A", email: "a@a.com" },
	{ name: "User B", email: "b@b.com" },
];

function fakeId(): string {
	return crypto.randomUUID();
}

function daysAgo(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - days);
	d.setHours(
		Math.floor(Math.random() * 12) + 7,
		Math.floor(Math.random() * 60),
		Math.floor(Math.random() * 60),
		0,
	);
	return d;
}

function pick<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)] as T;
}

function buildEntries(
	ctx: CoreContext,
	userIds: string[],
	unitRefs: UnitRefs,
	contractRefs: ContractRefs,
): AuditEntry[] {
	const entries: AuditEntry[] = [];
	const orgId = ctx.org.id;

	// Real entity IDs
	const unitMap = [
		{ name: "Criciúma", id: unitRefs.criciumaUnit.id },
		{ name: "Joinville", id: unitRefs.joinvilleUnit.id },
		{ name: "Blumenau", id: unitRefs.blumenauUnit.id },
	];

	const equipmentMap = [
		{ name: "Atomizador CRI", id: unitRefs.criciumaAtomizer.id },
		{ name: "Linha 1 CRI", id: unitRefs.criciumaLines[0]?.id ?? "" },
		{ name: "Linha 2 CRI", id: unitRefs.criciumaLines[1]?.id ?? "" },
		{ name: "Atomizador JOI", id: unitRefs.joinvilleAtomizer.id },
		{ name: "ATM 250 BLU", id: unitRefs.blumenauAtm250.id },
		{ name: "Secador 2 BLU", id: unitRefs.blumenauDryer.id },
	];

	function userCtx(): { userId: string; userName: string; userEmail: string } {
		const idx = Math.floor(Math.random() * USERS.length);
		return {
			userId: userIds[idx] ?? "",
			userName: USERS[idx]?.name ?? "Unknown",
			userEmail: USERS[idx]?.email ?? "unknown@test.com",
		};
	}

	// --- Login/Logout events (10 entries) ---
	for (let i = 0; i < 5; i++) {
		const u = userCtx();
		const loginDay = daysAgo(Math.floor(Math.random() * 30));
		entries.push({
			entityType: "session",
			entityId: u.userId,
			entityName: u.userName,
			action: "login",
			field: null,
			oldValue: null,
			newValue: null,
			changes: null,
			userId: u.userId,
			userName: u.userName,
			userEmail: u.userEmail,
			organizationId: orgId,
			metadata: JSON.stringify({
				ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
			}),
			createdAt: loginDay,
		});

		const logoutTime = new Date(loginDay);
		logoutTime.setHours(logoutTime.getHours() + Math.floor(Math.random() * 8) + 1);
		entries.push({
			entityType: "session",
			entityId: u.userId,
			entityName: u.userName,
			action: "logout",
			field: null,
			oldValue: null,
			newValue: null,
			changes: null,
			userId: u.userId,
			userName: u.userName,
			userEmail: u.userEmail,
			organizationId: orgId,
			metadata: JSON.stringify({
				ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
			}),
			createdAt: logoutTime,
		});
	}

	// --- Contract changes (8 entries) — use real contract IDs ---
	const mainContractId = contractRefs.mainContractId;
	const contractName = "Contrato Principal de Gás Natural";

	entries.push({
		entityType: "contract",
		entityId: mainContractId,
		entityName: contractName,
		action: "create",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			name: { old: null, new: contractName },
			qdcContracted: { old: null, new: 134800 },
			transportToleranceUpperPercent: { old: null, new: 10 },
			transportToleranceLowerPercent: { old: null, new: 20 },
			active: { old: null, new: true },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(28),
	});

	entries.push({
		entityType: "contract",
		entityId: mainContractId,
		entityName: contractName,
		action: "update",
		field: "qdcContracted",
		oldValue: "134800",
		newValue: "140000",
		changes: JSON.stringify({
			qdcContracted: { old: 134800, new: 140000 },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(20),
	});

	entries.push({
		entityType: "contract",
		entityId: mainContractId,
		entityName: contractName,
		action: "update",
		field: "transportToleranceUpperPercent",
		oldValue: "10",
		newValue: "12",
		changes: JSON.stringify({
			transportToleranceUpperPercent: { old: 10, new: 12 },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(15),
	});

	entries.push({
		entityType: "contract",
		entityId: mainContractId,
		entityName: contractName,
		action: "update",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			transportToleranceLowerPercent: { old: 20, new: 18 },
			moleculeTolerancePercent: { old: 5, new: 7 },
			notes: { old: "Contrato principal", new: "Contrato principal com tolerâncias revisadas" },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(10),
	});

	// Secondary contract — use real ID
	const secondaryContractId = contractRefs.secondaryContractId;
	entries.push({
		entityType: "contract",
		entityId: secondaryContractId,
		entityName: "Contrato Secundário SC",
		action: "create",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			name: { old: null, new: "Contrato Secundário SC" },
			qdcContracted: { old: null, new: 50000 },
			active: { old: null, new: true },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(12),
	});

	entries.push({
		entityType: "contract",
		entityId: secondaryContractId,
		entityName: "Contrato Secundário SC",
		action: "update",
		field: "active",
		oldValue: "true",
		newValue: "false",
		changes: JSON.stringify({ active: { old: true, new: false } }),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(5),
	});

	entries.push({
		entityType: "contract",
		entityId: secondaryContractId,
		entityName: "Contrato Secundário SC",
		action: "update",
		field: "active",
		oldValue: "false",
		newValue: "true",
		changes: JSON.stringify({ active: { old: false, new: true } }),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(3),
	});

	// Deleted contract — keep fakeId since it represents a removed entity
	entries.push({
		entityType: "contract",
		entityId: fakeId(),
		entityName: "Contrato Teste Expirado",
		action: "delete",
		field: null,
		oldValue: null,
		newValue: null,
		changes: null,
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(7),
	});

	// --- Unit changes (6 entries) — use real unit IDs ---
	for (const unit of unitMap) {
		entries.push({
			entityType: "unit",
			entityId: unit.id,
			entityName: unit.name,
			action: "create",
			field: null,
			oldValue: null,
			newValue: null,
			changes: JSON.stringify({
				name: { old: null, new: unit.name },
				active: { old: null, new: true },
			}),
			...userCtx(),
			organizationId: orgId,
			metadata: null,
			createdAt: daysAgo(27),
		});
	}

	entries.push({
		entityType: "unit",
		entityId: unitRefs.criciumaUnit.id,
		entityName: "Criciúma",
		action: "update",
		field: "description",
		oldValue: "Unidade de Criciúma",
		newValue: "Unidade de Criciúma - SC (principal)",
		changes: JSON.stringify({
			description: { old: "Unidade de Criciúma", new: "Unidade de Criciúma - SC (principal)" },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(18),
	});

	entries.push({
		entityType: "unit",
		entityId: unitRefs.joinvilleUnit.id,
		entityName: "Joinville",
		action: "update",
		field: "active",
		oldValue: "true",
		newValue: "false",
		changes: JSON.stringify({ active: { old: true, new: false } }),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(4),
	});

	entries.push({
		entityType: "unit",
		entityId: unitRefs.joinvilleUnit.id,
		entityName: "Joinville",
		action: "update",
		field: "active",
		oldValue: "false",
		newValue: "true",
		changes: JSON.stringify({ active: { old: false, new: true } }),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(2),
	});

	// --- Equipment changes (8 entries) — use real equipment IDs ---
	for (const eq of equipmentMap.slice(0, 4)) {
		entries.push({
			entityType: "parameter",
			entityId: eq.id,
			entityName: eq.name,
			action: "create",
			field: null,
			oldValue: null,
			newValue: null,
			changes: JSON.stringify({
				name: { old: null, new: eq.name },
				type: { old: null, new: eq.name.includes("Linha") ? "line" : "atomizer" },
				active: { old: null, new: true },
			}),
			...userCtx(),
			organizationId: orgId,
			metadata: null,
			createdAt: daysAgo(26),
		});
	}

	entries.push({
		entityType: "parameter",
		entityId: unitRefs.criciumaAtomizer.id,
		entityName: "Atomizador CRI",
		action: "update",
		field: "consumptionRate",
		oldValue: "1500",
		newValue: "1550",
		changes: JSON.stringify({
			consumptionRate: { old: 1500, new: 1550 },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(14),
	});

	entries.push({
		entityType: "parameter",
		entityId: unitRefs.criciumaLines[1]?.id ?? "",
		entityName: "Linha 2 CRI",
		action: "update",
		field: "active",
		oldValue: "true",
		newValue: "false",
		changes: JSON.stringify({ active: { old: true, new: false } }),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(9),
	});

	entries.push({
		entityType: "parameter",
		entityId: unitRefs.blumenauAtm250.id,
		entityName: "ATM 250 BLU",
		action: "update",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			consumptionRate: { old: 2500, new: 2600 },
			notes: { old: "Taxa padrão", new: "Taxa atualizada após manutenção" },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(6),
	});

	// Deleted equipment — keep fakeId since it represents a removed entity
	entries.push({
		entityType: "parameter",
		entityId: fakeId(),
		entityName: "Secador 2 BLU",
		action: "delete",
		field: null,
		oldValue: null,
		newValue: null,
		changes: null,
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(1),
	});

	// --- Scheduling / Plan changes (10 entries) ---
	const unitNames = ["Criciúma", "Joinville", "Blumenau"];
	for (let i = 0; i < 5; i++) {
		const planId = fakeId();
		const unitName = pick(unitNames);
		const day = 25 - i * 4;
		const dateStr = formatDateOffset(day);

		entries.push({
			entityType: "plan",
			entityId: planId,
			entityName: `Programação ${unitName} - ${dateStr}`,
			action: "create",
			field: null,
			oldValue: null,
			newValue: null,
			changes: JSON.stringify({
				qdp: { old: null, new: Math.floor(Math.random() * 5000) + 3000 },
				date: { old: null, new: dateStr },
			}),
			...userCtx(),
			organizationId: orgId,
			metadata: null,
			createdAt: daysAgo(day),
		});

		entries.push({
			entityType: "plan",
			entityId: planId,
			entityName: `Programação ${unitName} - ${dateStr}`,
			action: "update",
			field: "submitted",
			oldValue: null,
			newValue: new Date().toISOString(),
			changes: JSON.stringify({
				submitted: { old: null, new: "submitted" },
			}),
			...userCtx(),
			organizationId: orgId,
			metadata: null,
			createdAt: daysAgo(day - 1 > 0 ? day - 1 : 1),
		});
	}

	// --- Consumption entries (8 entries) ---
	for (let i = 0; i < 4; i++) {
		const consumptionId = fakeId();
		const unitName = pick(unitNames);
		const day = 22 - i * 5;
		const dateStr = formatDateOffset(day);
		const qdr = Math.floor(Math.random() * 6000) + 2000;

		entries.push({
			entityType: "consumption",
			entityId: consumptionId,
			entityName: `Consumo ${unitName} - ${dateStr}`,
			action: "create",
			field: null,
			oldValue: null,
			newValue: null,
			changes: JSON.stringify({
				qdr: { old: null, new: qdr },
				date: { old: null, new: dateStr },
				unit: { old: null, new: unitName },
			}),
			...userCtx(),
			organizationId: orgId,
			metadata: null,
			createdAt: daysAgo(day),
		});

		entries.push({
			entityType: "consumption",
			entityId: consumptionId,
			entityName: `Consumo ${unitName} - ${dateStr}`,
			action: "update",
			field: "qdr",
			oldValue: String(qdr),
			newValue: String(qdr + Math.floor(Math.random() * 500)),
			changes: JSON.stringify({
				qdr: { old: qdr, new: qdr + Math.floor(Math.random() * 500) },
			}),
			...userCtx(),
			organizationId: orgId,
			metadata: null,
			createdAt: daysAgo(day > 1 ? day - 1 : 1),
		});
	}

	// --- Alert configuration changes (4 entries) ---
	entries.push({
		entityType: "alert",
		entityId: fakeId(),
		entityName: "Alerta de Desvio > 15%",
		action: "create",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			name: { old: null, new: "Alerta de Desvio > 15%" },
			thresholdPercent: { old: null, new: 15 },
			active: { old: null, new: true },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(24),
	});

	entries.push({
		entityType: "alert",
		entityId: fakeId(),
		entityName: "Alerta de Desvio > 15%",
		action: "update",
		field: "thresholdPercent",
		oldValue: "15",
		newValue: "12",
		changes: JSON.stringify({
			thresholdPercent: { old: 15, new: 12 },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(16),
	});

	entries.push({
		entityType: "alert",
		entityId: fakeId(),
		entityName: "Alerta Consumo Zero",
		action: "create",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			name: { old: null, new: "Alerta Consumo Zero" },
			type: { old: null, new: "zero_consumption" },
			active: { old: null, new: true },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(22),
	});

	entries.push({
		entityType: "alert",
		entityId: fakeId(),
		entityName: "Alerta Consumo Zero",
		action: "delete",
		field: null,
		oldValue: null,
		newValue: null,
		changes: null,
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(8),
	});

	// --- Template changes (2 entries) ---
	entries.push({
		entityType: "template",
		entityId: fakeId(),
		entityName: "Template CUSD Padrão",
		action: "create",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			name: { old: null, new: "Template CUSD Padrão" },
			type: { old: null, new: "cusd" },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(25),
	});

	entries.push({
		entityType: "template",
		entityId: fakeId(),
		entityName: "Template CUSD Padrão",
		action: "update",
		field: "content",
		oldValue: "Versão 1.0",
		newValue: "Versão 1.1",
		changes: JSON.stringify({
			content: { old: "Versão 1.0", new: "Versão 1.1" },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(11),
	});

	// --- Custom field changes (2 entries) ---
	entries.push({
		entityType: "custom_field",
		entityId: fakeId(),
		entityName: "Responsável Técnico",
		action: "create",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			label: { old: null, new: "Responsável Técnico" },
			fieldType: { old: null, new: "text" },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(23),
	});

	entries.push({
		entityType: "custom_field",
		entityId: fakeId(),
		entityName: "Turno de Operação",
		action: "create",
		field: null,
		oldValue: null,
		newValue: null,
		changes: JSON.stringify({
			label: { old: null, new: "Turno de Operação" },
			fieldType: { old: null, new: "select" },
			options: { old: null, new: ["Manhã", "Tarde", "Noite"] },
		}),
		...userCtx(),
		organizationId: orgId,
		metadata: null,
		createdAt: daysAgo(21),
	});

	// Sort by createdAt ascending
	entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

	return entries;
}

function formatDateOffset(daysAgo: number): string {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export async function seedGasAudit(
	db: typeof Db,
	ctx: CoreContext,
	unitRefs: UnitRefs,
	contractRefs: ContractRefs,
): Promise<void> {
	console.log("📋 Seeding audit log data...");

	// Idempotent: delete existing seed data for this org
	const deleted = await db.gasAuditLog.deleteMany({
		where: { organizationId: ctx.org.id },
	});
	if (deleted.count > 0) {
		console.log(`  🗑️  Cleared ${deleted.count} existing audit log entries`);
	}

	// Resolve user IDs from database
	const users = await db.user.findMany({
		where: { email: { in: USERS.map((u) => u.email) } },
		select: { id: true, email: true },
	});
	const userIds = USERS.map(
		(u) => users.find((dbUser) => dbUser.email === u.email)?.id ?? "",
	);

	const entries = buildEntries(ctx, userIds, unitRefs, contractRefs);

	// Batch insert for performance
	await db.gasAuditLog.createMany({
		data: entries,
	});

	console.log(`✅ Audit log seeded with ${entries.length} entries`);

	// Print summary
	const actionCounts = new Map<string, number>();
	const entityCounts = new Map<string, number>();
	for (const e of entries) {
		actionCounts.set(e.action, (actionCounts.get(e.action) ?? 0) + 1);
		entityCounts.set(e.entityType, (entityCounts.get(e.entityType) ?? 0) + 1);
	}
	console.log("  Actions:", Object.fromEntries(actionCounts));
	console.log("  Entities:", Object.fromEntries(entityCounts));
}
