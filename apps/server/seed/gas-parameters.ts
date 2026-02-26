import type { CoreContext } from "./core";

export async function seedGasParameters(
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	ctx: CoreContext,
): Promise<void> {
	console.log("⚙️ Seeding system parameters, templates, and custom fields...");

	// === GasSystemParameter ===
	console.log("📋 Creating system parameters...");

	const systemParameters = [
		// --- Alert Thresholds ---
		{
			category: "alert_thresholds",
			key: "deviation_threshold_percent",
			name: "Limiar de Desvio (%)",
			description:
				"Percentual de desvio entre QDP e QDR que dispara alerta de desvio de transporte ou molécula.",
			value: "15",
			valueType: "percentage",
			defaultValue: "15",
			minValue: 1,
			maxValue: 50,
			orderIndex: 0,
			organizationId: ctx.org.id,
		},
		{
			category: "alert_thresholds",
			key: "critical_deviation_threshold_percent",
			name: "Limiar de Desvio Crítico (%)",
			description: "Percentual de desvio que dispara alerta crítico com notificação imediata.",
			value: "25",
			valueType: "percentage",
			defaultValue: "25",
			minValue: 5,
			maxValue: 80,
			orderIndex: 1,
			organizationId: ctx.org.id,
		},
		{
			category: "alert_thresholds",
			key: "contract_expiration_notice_days",
			name: "Aviso Prévio de Vencimento (dias)",
			description:
				"Dias de antecedência para notificar sobre vencimento de contrato. Valor JSON com lista de dias.",
			value: JSON.stringify([90, 30, 15, 7]),
			valueType: "json",
			defaultValue: JSON.stringify([90, 30, 15, 7]),
			orderIndex: 2,
			organizationId: ctx.org.id,
		},
		{
			category: "alert_thresholds",
			key: "scheduling_reminder_time",
			name: "Horário de Lembrete de Programação",
			description: "Horário diário para envio do lembrete de programação diária.",
			value: '"09:00"',
			valueType: "string",
			defaultValue: '"09:00"',
			orderIndex: 3,
			organizationId: ctx.org.id,
		},

		// --- Penalty Formulas ---
		{
			category: "penalty_formulas",
			key: "take_or_pay_formula",
			name: "Fórmula Take-or-Pay",
			description:
				"Fórmula de cálculo da penalidade por take-or-pay: Multa = (QDC × TOP% - QDR) × Preço_base, quando QDR < QDC × TOP%.",
			value:
				'"Multa_TOP = (QDC × take_or_pay_percent / 100 - QDR) × base_price_per_unit"',
			valueType: "formula",
			defaultValue:
				'"Multa_TOP = (QDC × take_or_pay_percent / 100 - QDR) × base_price_per_unit"',
			orderIndex: 0,
			organizationId: ctx.org.id,
		},
		{
			category: "penalty_formulas",
			key: "overdemand_formula",
			name: "Fórmula de Sobre-demanda (CUSD)",
			description:
				"Fórmula CUSD: Tier 1 (≤110% CDC): isento. Tier 2 (110–115% CDC): TUSD × 1,0. Tier 3 (>115% CDC): TUSD × 1,5.",
			value:
				'"Tier1: isento (QDR ≤ CDC×1.10). Tier2: TUSD×1.0 (CDC×1.10 < QDR ≤ CDC×1.15). Tier3: TUSD×1.5 (QDR > CDC×1.15)"',
			valueType: "formula",
			defaultValue:
				'"Tier1: isento (QDR ≤ CDC×1.10). Tier2: TUSD×1.0 (CDC×1.10 < QDR ≤ CDC×1.15). Tier3: TUSD×1.5 (QDR > CDC×1.15)"',
			orderIndex: 1,
			organizationId: ctx.org.id,
		},
		{
			category: "penalty_formulas",
			key: "cmc_formula",
			name: "Fórmula CMC (Consumo Mínimo Contratado)",
			description:
				"Penalidade por consumo abaixo do CMC: Multa_CMC = (CDC × cmc_min_usage_percent/100 - QDR) × TUSD quando QDR < CMC.",
			value:
				'"Multa_CMC = (CDC × cmc_min_usage_percent/100 - QDR) × tusd_tariff_per_unit"',
			valueType: "formula",
			defaultValue:
				'"Multa_CMC = (CDC × cmc_min_usage_percent/100 - QDR) × tusd_tariff_per_unit"',
			orderIndex: 2,
			organizationId: ctx.org.id,
		},

		// --- Business Rules ---
		{
			category: "business_rules",
			key: "daily_scheduling_required",
			name: "Programação Diária Obrigatória",
			description: "Se verdadeiro, a programação diária (QDP) deve ser enviada antes do prazo do contrato.",
			value: "true",
			valueType: "boolean",
			defaultValue: "true",
			orderIndex: 0,
			organizationId: ctx.org.id,
		},
		{
			category: "business_rules",
			key: "monthly_declaration_required",
			name: "Declaração Mensal Obrigatória",
			description: "Se verdadeiro, a declaração mensal de consumo deve ser enviada até o dia definido no contrato.",
			value: "true",
			valueType: "boolean",
			defaultValue: "true",
			orderIndex: 1,
			organizationId: ctx.org.id,
		},
		{
			category: "business_rules",
			key: "auto_approve_scheduling_days",
			name: "Auto-aprovar Programação (dias)",
			description:
				"Número de dias após o prazo que uma programação submetida é aprovada automaticamente se não houver revisão manual.",
			value: "2",
			valueType: "number",
			defaultValue: "2",
			minValue: 0,
			maxValue: 7,
			orderIndex: 2,
			organizationId: ctx.org.id,
		},
	];

	for (const param of systemParameters) {
		await userDb.gasSystemParameter.create({ data: param });
	}

	console.log("✅ System parameters created");

	// === GasContractTemplate ===
	console.log("📄 Creating contract templates...");

	const contractTemplates = [
		{
			name: "Contrato Industrial Padrão",
			description:
				"Template padrão para contratos industriais com take-or-pay de 80% e tolerâncias de transporte de ±10/20%.",
			contractType: "industrial",
			templateValues: JSON.stringify({
				volumeUnit: "m3",
				transportToleranceUpperPercent: 10,
				transportToleranceLowerPercent: 20,
				moleculeTolerancePercent: 5,
				takeOrPayPercent: 80,
				takeOrPayAccumulationMonths: 12,
				makeUpGasEnabled: true,
				makeUpGasExpirationMonths: 12,
				flexibilityUpPercent: 10,
				flexibilityDownPercent: 20,
				priceCurrency: "BRL",
				adjustmentIndex: "IGPM",
				adjustmentFrequency: "monthly",
				cmcMinUsagePercent: 90,
				pvemaTolerancePercent: 10,
				pvemeTolerancePercent: 20,
				overdemandTier1MaxPercent: 110,
				overdemandTier2MaxPercent: 115,
				overdemandTier2Multiplier: 1.0,
				overdemandTier3Multiplier: 1.5,
				dailySchedulingDeadline: "10:00",
				monthlyDeclarationDeadline: 5,
				renewalNoticeDays: 90,
			}),
			isDefault: true,
			active: true,
			organizationId: ctx.org.id,
		},
		{
			name: "Contrato CUSD Distribuidora",
			description:
				"Template para contratos com distribuidoras de gás seguindo as regras CUSD da ANEEL. Penalidades em 3 faixas de sobre-demanda.",
			contractType: "cusd",
			templateValues: JSON.stringify({
				volumeUnit: "m3",
				transportToleranceUpperPercent: 15,
				transportToleranceLowerPercent: 15,
				moleculeTolerancePercent: 7,
				takeOrPayPercent: 70,
				makeUpGasEnabled: false,
				priceCurrency: "BRL",
				adjustmentIndex: "IPCA",
				adjustmentFrequency: "quarterly",
				cmcMinUsagePercent: 85,
				pvemaTolerancePercent: 15,
				pvemeTolerancePercent: 15,
				overdemandTier1MaxPercent: 110,
				overdemandTier2MaxPercent: 120,
				overdemandTier2Multiplier: 1.0,
				overdemandTier3Multiplier: 2.0,
				dailySchedulingDeadline: "09:00",
				monthlyDeclarationDeadline: 3,
				renewalNoticeDays: 60,
			}),
			isDefault: false,
			active: true,
			organizationId: ctx.org.id,
		},
	];

	for (const template of contractTemplates) {
		await userDb.gasContractTemplate.create({ data: template });
	}

	console.log("✅ Contract templates created");

	// === GasCustomField ===
	console.log("🗂️ Creating custom fields...");

	const customFields = [
		// Contract custom fields
		{
			fieldName: "responsible_engineer",
			displayName: "Engenheiro Responsável",
			fieldType: "text",
			required: false,
			entityType: "contract",
			orderIndex: 0,
			organizationId: ctx.org.id,
		},
		{
			fieldName: "internal_process_number",
			displayName: "Número do Processo Interno",
			fieldType: "text",
			required: false,
			entityType: "contract",
			orderIndex: 1,
			organizationId: ctx.org.id,
		},
		{
			fieldName: "regulatory_agency",
			displayName: "Agência Reguladora",
			fieldType: "select",
			required: false,
			options: JSON.stringify(["ANEEL", "ANP", "ARESC", "ARSEP", "Outro"]),
			entityType: "contract",
			orderIndex: 2,
			organizationId: ctx.org.id,
		},
		// Unit custom fields
		{
			fieldName: "operation_shift",
			displayName: "Turno de Operação",
			fieldType: "select",
			required: false,
			options: JSON.stringify(["Manhã", "Tarde", "Noite", "Contínuo"]),
			entityType: "unit",
			orderIndex: 0,
			organizationId: ctx.org.id,
		},
		{
			fieldName: "metering_point_code",
			displayName: "Código do Ponto de Medição",
			fieldType: "text",
			required: false,
			entityType: "unit",
			orderIndex: 1,
			organizationId: ctx.org.id,
		},
	];

	for (const field of customFields) {
		await userDb.gasCustomField.create({ data: field });
	}

	console.log("✅ Custom fields created");
}
