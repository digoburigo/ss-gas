import type { ContractRefs } from "./gas-contracts";
import type { CoreContext } from "./core";

function daysAgo(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

export async function seedGasContractVersions(
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	ctx: CoreContext,
	contractRefs: ContractRefs,
): Promise<void> {
	console.log("📋 Seeding contract versions...");

	// Main contract (CTG-2024-001): 3 versions
	// v1 — Original contract (2y ago)
	await userDb.gasContractVersion.create({
		data: {
			contractId: contractRefs.mainContractId,
			versionNumber: 1,
			isActive: false,
			dataSnapshot: JSON.stringify({
				name: "Contrato Principal de Gás Natural",
				contractNumber: "CTG-2024-001",
				qdcContracted: 130000,
				basePricePerUnit: 4.5,
				takeOrPayPercent: 80,
				transportToleranceUpperPercent: 10,
				transportToleranceLowerPercent: 15,
				moleculeTolerancePercent: 5,
				flexibilityUpPercent: 8,
				flexibilityDownPercent: 15,
			}),
			extractedDataSummary:
				"Contrato original com QDC de 130.000 m3 e tolerâncias conservadoras.",
			fileName: "CTG-2024-001_v1_original.pdf",
			fileType: "application/pdf",
			uploadedAt: daysAgo(730),
			uploadedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	// v2 — Amendment (1y ago): increased QDC and tolerances
	await userDb.gasContractVersion.create({
		data: {
			contractId: contractRefs.mainContractId,
			versionNumber: 2,
			isActive: false,
			dataSnapshot: JSON.stringify({
				name: "Contrato Principal de Gás Natural",
				contractNumber: "CTG-2024-001",
				qdcContracted: 134800,
				basePricePerUnit: 4.72,
				takeOrPayPercent: 80,
				transportToleranceUpperPercent: 10,
				transportToleranceLowerPercent: 20,
				moleculeTolerancePercent: 5,
				flexibilityUpPercent: 10,
				flexibilityDownPercent: 20,
			}),
			extractedDataSummary:
				"Aditivo contratual: QDC aumentado para 134.800 m3, tolerância inferior de transporte ampliada para 20%.",
			fileName: "CTG-2024-001_v2_aditivo.pdf",
			fileType: "application/pdf",
			uploadedAt: daysAgo(365),
			uploadedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	// v3 — Current (3mo ago): price adjustment
	await userDb.gasContractVersion.create({
		data: {
			contractId: contractRefs.mainContractId,
			versionNumber: 3,
			isActive: true,
			dataSnapshot: JSON.stringify({
				name: "Contrato Principal de Gás Natural",
				contractNumber: "CTG-2024-001",
				qdcContracted: 134800,
				basePricePerUnit: 4.85,
				takeOrPayPercent: 80,
				transportToleranceUpperPercent: 10,
				transportToleranceLowerPercent: 20,
				moleculeTolerancePercent: 5,
				flexibilityUpPercent: 10,
				flexibilityDownPercent: 20,
				makeUpGasEnabled: true,
				tusdTariffPerUnit: 0.45,
			}),
			extractedDataSummary:
				"Versão vigente com reajuste de preço para R$ 4,85/m3 e inclusão de cláusula make-up gas.",
			fileName: "CTG-2024-001_v3_reajuste.pdf",
			fileType: "application/pdf",
			uploadedAt: daysAgo(90),
			uploadedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	// Secondary contract (CTG-2025-002): 1 version
	await userDb.gasContractVersion.create({
		data: {
			contractId: contractRefs.secondaryContractId,
			versionNumber: 1,
			isActive: true,
			dataSnapshot: JSON.stringify({
				name: "Contrato Secundário SC - Fornecimento Complementar",
				contractNumber: "CTG-2025-002",
				qdcContracted: 50000,
				basePricePerUnit: 5.1,
				takeOrPayPercent: 70,
				transportToleranceUpperPercent: 15,
				transportToleranceLowerPercent: 15,
				moleculeTolerancePercent: 7,
				tusdTariffPerUnit: 0.52,
			}),
			extractedDataSummary:
				"Contrato complementar para Blumenau com QDC de 50.000 m3.",
			fileName: "CTG-2025-002_v1_original.pdf",
			fileType: "application/pdf",
			uploadedAt: daysAgo(365),
			uploadedById: ctx.user.id,
			organizationId: ctx.org.id,
		},
	});

	console.log("✅ Contract versions seeded (4 entries)");
}
