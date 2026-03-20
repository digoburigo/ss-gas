import type { ContractRefs } from "./gas-contracts";
import type { CoreContext } from "./core";

function daysAgo(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

function daysFromNow(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

export async function seedGasTariffHistory(
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	ctx: CoreContext,
	contractRefs: ContractRefs,
): Promise<void> {
	console.log("💰 Seeding tariff history...");

	// Main contract (CTG-2024-001): 4 tariff entries covering all statuses
	// 1. Historical approved tariff (2y ago → 1y ago)
	await userDb.gasTariffHistory.create({
		data: {
			contractId: contractRefs.mainContractId,
			tariffPerUnit: 4.5,
			currency: "BRL",
			effectiveFrom: daysAgo(730),
			effectiveTo: daysAgo(365),
			tusdTariff: 0.4,
			transportCost: 0.38,
			notes: "Tarifa inicial do contrato. Reajuste pelo IGPM acumulado.",
			status: "approved",
			approvedAt: daysAgo(735),
			approvedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	// 2. Historical approved tariff (1y ago → 3mo ago)
	await userDb.gasTariffHistory.create({
		data: {
			contractId: contractRefs.mainContractId,
			tariffPerUnit: 4.72,
			currency: "BRL",
			effectiveFrom: daysAgo(365),
			effectiveTo: daysAgo(90),
			tusdTariff: 0.43,
			transportCost: 0.41,
			notes: "Reajuste anual pelo IGPM. Aumento de 4,89%.",
			status: "approved",
			approvedAt: daysAgo(370),
			approvedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	// 3. Active tariff (3mo ago → ongoing)
	await userDb.gasTariffHistory.create({
		data: {
			contractId: contractRefs.mainContractId,
			tariffPerUnit: 4.85,
			currency: "BRL",
			effectiveFrom: daysAgo(90),
			effectiveTo: null,
			tusdTariff: 0.45,
			transportCost: 0.43,
			notes: "Tarifa vigente. Reajuste trimestral pelo IGPM.",
			status: "active",
			approvedAt: daysAgo(95),
			approvedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	// 4. Pending tariff (starts in 30 days)
	await userDb.gasTariffHistory.create({
		data: {
			contractId: contractRefs.mainContractId,
			tariffPerUnit: 4.98,
			currency: "BRL",
			effectiveFrom: daysFromNow(30),
			effectiveTo: null,
			tusdTariff: 0.47,
			transportCost: 0.45,
			notes: "Proposta de reajuste pendente de aprovação. IGPM acumulado de 2,68%.",
			status: "pending",
			organizationId: ctx.org.id,
		},
	});

	// Secondary contract (CTG-2025-002): 2 tariff entries
	// 5. Active tariff (1y ago → ongoing)
	await userDb.gasTariffHistory.create({
		data: {
			contractId: contractRefs.secondaryContractId,
			tariffPerUnit: 5.1,
			currency: "BRL",
			effectiveFrom: daysAgo(365),
			effectiveTo: null,
			tusdTariff: 0.52,
			transportCost: 0.48,
			notes: "Tarifa inicial do contrato secundário.",
			status: "active",
			approvedAt: daysAgo(370),
			approvedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	// 6. Rejected tariff (6mo ago)
	await userDb.gasTariffHistory.create({
		data: {
			contractId: contractRefs.secondaryContractId,
			tariffPerUnit: 5.35,
			currency: "BRL",
			effectiveFrom: daysAgo(180),
			effectiveTo: null,
			tusdTariff: 0.55,
			transportCost: 0.5,
			notes: "Proposta rejeitada. Aumento de 4,9% considerado acima do aceitável pelo comitê.",
			status: "rejected",
			organizationId: ctx.org.id,
		},
	});

	console.log("✅ Tariff history seeded (6 entries, 4 statuses)");
}
