import type { CoreContext } from "./core";
import type { UnitRefs } from "./gas-units";

export interface ContractRefs {
	mainContractId: string;
	secondaryContractId: string;
}

function daysFromNow(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

function daysAgo(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

export async function seedGasContracts(
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	ctx: CoreContext,
	unitRefs: UnitRefs,
): Promise<ContractRefs> {
	console.log("📜 Creating contracts...");

	// === Main Contract ===
	const mainContract = await userDb.gasContract.create({
		data: {
			// Basic data
			name: "Contrato Principal de Gás Natural",
			contractNumber: "CTG-2024-001",
			supplier: "Comgás - Companhia de Gás de São Paulo",
			supplierCnpj: "61.856.571/0001-63",

			// Volumes
			qdcContracted: 134800,
			volumeUnit: "m3",
			transportToleranceUpperPercent: 10,
			transportToleranceLowerPercent: 20,
			moleculeTolerancePercent: 5,

			// Take-or-Pay
			takeOrPayPercent: 80,
			takeOrPayAccumulationMonths: 12,
			takeOrPayExpirationMonths: 24,

			// Make-up Gas
			makeUpGasEnabled: true,
			makeUpGasExpirationMonths: 12,
			makeUpGasMaxPercent: 20,

			// Flexibility
			flexibilityUpPercent: 10,
			flexibilityDownPercent: 20,
			seasonalFlexibility: false,

			// Pricing
			basePricePerUnit: 4.85,
			priceCurrency: "BRL",
			adjustmentIndex: "IGPM",
			adjustmentFrequency: "monthly",
			adjustmentBaseDate: daysAgo(365),
			nextAdjustmentDate: daysFromNow(30),
			transportCostPerUnit: 0.45,
			taxesIncluded: false,

			// Penalties
			penaltyForUnderConsumption: 100,
			penaltyForOverConsumption: 150,
			penaltyCalculationMethod:
				"Multa calculada sobre o volume não consumido abaixo do take-or-pay, valorizado ao preço base do contrato.",
			latePaymentPenaltyPercent: 2,
			latePaymentInterestPercent: 1,

			// CUSD parameters
			cmcMinUsagePercent: 90,
			pvemaTolerancePercent: 10,
			pvemeTolerancePercent: 20,
			overdemandTier1MaxPercent: 110,
			overdemandTier2MaxPercent: 115,
			overdemandTier2Multiplier: 1.0,
			overdemandTier3Multiplier: 1.5,
			tusdTariffPerUnit: 0.45,

			// Dates
			effectiveFrom: daysAgo(365 * 2),
			effectiveTo: daysFromNow(365 * 2),
			renewalDate: daysFromNow(365 * 2 - 90),
			renewalNoticeDays: 90,

			// Deadlines
			dailySchedulingDeadline: "10:00",
			monthlyDeclarationDeadline: 5,

			active: true,
			notes:
				"Contrato principal com tolerâncias padrão de transporte e molécula. Cobre as unidades de Criciúma, Joinville e Blumenau.",
			organizationId: ctx.org.id,
		},
	});

	console.log("✅ Main contract created:", mainContract.contractNumber);

	// === Secondary Contract (Blumenau secondary supply) ===
	const secondaryContract = await userDb.gasContract.create({
		data: {
			name: "Contrato Secundário SC - Fornecimento Complementar",
			contractNumber: "CTG-2025-002",
			supplier: "Distribuidora de Gás do Sul Ltda.",
			supplierCnpj: "78.432.987/0001-55",

			qdcContracted: 50000,
			volumeUnit: "m3",
			transportToleranceUpperPercent: 15,
			transportToleranceLowerPercent: 15,
			moleculeTolerancePercent: 7,

			takeOrPayPercent: 70,
			makeUpGasEnabled: false,

			basePricePerUnit: 5.10,
			priceCurrency: "BRL",
			adjustmentIndex: "IPCA",
			adjustmentFrequency: "quarterly",

			penaltyForUnderConsumption: 80,
			penaltyForOverConsumption: 120,

			cmcMinUsagePercent: 85,
			pvemaTolerancePercent: 15,
			pvemeTolerancePercent: 15,
			overdemandTier1MaxPercent: 110,
			overdemandTier2MaxPercent: 120,
			overdemandTier2Multiplier: 1.0,
			overdemandTier3Multiplier: 2.0,
			tusdTariffPerUnit: 0.52,

			effectiveFrom: daysAgo(365),
			effectiveTo: daysFromNow(365),
			renewalDate: daysFromNow(365 - 60),
			renewalNoticeDays: 60,

			dailySchedulingDeadline: "09:00",
			monthlyDeclarationDeadline: 3,

			active: true,
			notes: "Contrato complementar para abastecimento da unidade de Blumenau em períodos de alta demanda.",
			organizationId: ctx.org.id,
		},
	});

	console.log("✅ Secondary contract created:", secondaryContract.contractNumber);

	// === Unit ↔ Contract joins ===
	console.log("🔗 Linking units to contracts...");

	await userDb.gasUnitContract.createMany({
		data: [
			// All 3 units linked to main contract (primary)
			{ unitId: unitRefs.criciumaUnit.id, contractId: mainContract.id, isPrimary: true },
			{ unitId: unitRefs.joinvilleUnit.id, contractId: mainContract.id, isPrimary: true },
			{ unitId: unitRefs.blumenauUnit.id, contractId: mainContract.id, isPrimary: true },
			// Blumenau also has the secondary contract
			{ unitId: unitRefs.blumenauUnit.id, contractId: secondaryContract.id, isPrimary: false },
		],
	});

	console.log("✅ Unit-contract links created");

	// === Contract Alerts ===
	console.log("🔔 Creating contract alerts...");

	// Alert 1: Contract expiration for main contract
	const expirationAlert = await userDb.gasContractAlert.create({
		data: {
			contractId: mainContract.id,
			eventType: "contract_expiration",
			eventName: "Vencimento do Contrato Principal",
			eventDescription: "Alerta de vencimento do contrato principal de gás natural",
			eventDate: daysFromNow(365 * 2),
			recurrence: "once",
			advanceNoticeDays: [90, 30, 15, 7],
			active: true,
			organizationId: ctx.org.id,
		},
	});

	await userDb.gasContractAlertRecipient.createMany({
		data: [
			{ alertId: expirationAlert.id, email: "a@a.com", name: "User A" },
			{ alertId: expirationAlert.id, email: "juridico@empresa.com.br", name: "Jurídico" },
		],
	});

	// Alert 2: Renewal deadline for main contract
	const renewalAlert = await userDb.gasContractAlert.create({
		data: {
			contractId: mainContract.id,
			eventType: "renewal_deadline",
			eventName: "Prazo para Renovação do Contrato",
			eventDescription: "Prazo limite para iniciar negociação de renovação contratual",
			eventDate: daysFromNow(365 * 2 - 90),
			recurrence: "once",
			advanceNoticeDays: [30, 15, 7],
			active: true,
			organizationId: ctx.org.id,
		},
	});

	await userDb.gasContractAlertRecipient.createMany({
		data: [
			{ alertId: renewalAlert.id, email: "contratos@empresa.com.br", name: "Gestão de Contratos" },
			{ alertId: renewalAlert.id, email: "a@a.com", name: "User A" },
		],
	});

	// Alert 3: Daily scheduling deadline for main contract
	const schedulingAlert = await userDb.gasContractAlert.create({
		data: {
			contractId: mainContract.id,
			eventType: "daily_scheduling",
			eventName: "Prazo de Programação Diária",
			eventDescription: "Lembrete diário para envio da programação até 10:00",
			eventTime: "09:00",
			recurrence: "daily",
			advanceNoticeDays: [0],
			active: true,
			organizationId: ctx.org.id,
		},
	});

	await userDb.gasContractAlertRecipient.createMany({
		data: [
			{ alertId: schedulingAlert.id, email: "b@b.com", name: "User B" },
			{ alertId: schedulingAlert.id, email: "operacao.joi@empresa.com.br", name: "Operação JOI" },
			{ alertId: schedulingAlert.id, email: "operacao.blu@empresa.com.br", name: "Operação BLU" },
		],
	});

	console.log("✅ Contract alerts and recipients created");

	return {
		mainContractId: mainContract.id,
		secondaryContractId: secondaryContract.id,
	};
}
