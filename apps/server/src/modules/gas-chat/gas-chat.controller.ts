import { db } from "@acme/zen-v3";
import { createGateway } from "@ai-sdk/gateway";
import { Elysia, t } from "elysia";
import { streamText } from "ai";

import { betterAuth } from "../../plugins/better-auth";

const gateway = createGateway({
	apiKey: process.env.AI_GATEWAY_API_KEY,
});

const MessageSchema = t.Object({
	role: t.Union([t.Literal("user"), t.Literal("assistant")]),
	content: t.String(),
});

async function buildGasContext(organizationId: string): Promise<string> {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const startDate = new Date(year, month, 1);
	const endDate = new Date(year, month + 1, 0);

	const [contracts, units, recentConsumptions, recentPlans] =
		await Promise.all([
			db.gasContract.findMany({
				where: { organizationId, active: true },
				orderBy: { effectiveFrom: "desc" },
			}),
			db.gasUnit.findMany({
				where: { organizationId, active: true },
				orderBy: { code: "asc" },
			}),
			db.gasRealConsumption.findMany({
				where: {
					unit: { organizationId },
					date: { gte: startDate, lte: endDate },
				},
				include: { unit: true },
				orderBy: { date: "desc" },
				take: 60,
			}),
			db.gasDailyPlan.findMany({
				where: {
					unit: { organizationId },
					date: { gte: startDate, lte: endDate },
				},
				include: { unit: true },
				orderBy: { date: "desc" },
				take: 60,
			}),
		]);

	const sections: string[] = [];

	if (contracts.length > 0) {
		const contractsInfo = contracts.map((c) => ({
			nome: c.name,
			numero: c.contractNumber,
			fornecedor: c.supplier,
			qdcContratado: c.qdcContracted,
			vigenciaInicio: c.effectiveFrom,
			vigenciaFim: c.effectiveTo,
			toleranciaTransporteSuperior: c.transportToleranceUpperPercent,
			toleranciaTransporteInferior: c.transportToleranceLowerPercent,
			toleranciaMolecula: c.moleculeTolerancePercent,
			takeOrPayPercent: c.takeOrPayPercent,
			precoBase: c.basePricePerUnit,
		}));
		sections.push(`CONTRATOS ATIVOS:\n${JSON.stringify(contractsInfo, null, 2)}`);
	}

	if (units.length > 0) {
		const unitsInfo = units.map((u) => ({
			nome: u.name,
			codigo: u.code,
		}));
		sections.push(`UNIDADES CONSUMIDORAS:\n${JSON.stringify(unitsInfo, null, 2)}`);
	}

	if (recentConsumptions.length > 0) {
		const consumptionByUnit: Record<string, { dates: string[]; values: number[]; total: number }> = {};
		for (const c of recentConsumptions) {
			const unitName = c.unit.name;
			if (!consumptionByUnit[unitName]) {
				consumptionByUnit[unitName] = { dates: [], values: [], total: 0 };
			}
			consumptionByUnit[unitName].dates.push(
				new Date(c.date).toISOString().split("T")[0] ?? "",
			);
			consumptionByUnit[unitName].values.push(c.qdrValue);
			consumptionByUnit[unitName].total += c.qdrValue;
		}
		sections.push(
			`CONSUMO REAL DO MES (QDR - m3):\n${JSON.stringify(consumptionByUnit, null, 2)}`,
		);
	}

	if (recentPlans.length > 0) {
		const plansByUnit: Record<string, { total: number; count: number }> = {};
		for (const p of recentPlans) {
			const unitName = p.unit.name;
			if (!plansByUnit[unitName]) {
				plansByUnit[unitName] = { total: 0, count: 0 };
			}
			plansByUnit[unitName].total += p.qdpValue;
			plansByUnit[unitName].count += 1;
		}
		const planSummary = Object.entries(plansByUnit).map(([unit, data]) => ({
			unidade: unit,
			totalProgramado: data.total,
			diasProgramados: data.count,
			mediaDiaria: Math.round(data.total / data.count),
		}));
		sections.push(
			`PROGRAMACAO DO MES (QDP - m3):\n${JSON.stringify(planSummary, null, 2)}`,
		);
	}

	// Calculate deviations if both consumption and plans exist
	if (recentConsumptions.length > 0 && recentPlans.length > 0) {
		const planMap = new Map<string, number>();
		for (const p of recentPlans) {
			const key = `${p.unit.name}-${new Date(p.date).toISOString().split("T")[0]}`;
			planMap.set(key, p.qdpValue);
		}

		const deviations: Array<{ unidade: string; data: string; programado: number; real: number; desvioPercent: string }> = [];
		for (const c of recentConsumptions) {
			const dateStr = new Date(c.date).toISOString().split("T")[0];
			const key = `${c.unit.name}-${dateStr}`;
			const planned = planMap.get(key);
			if (planned && planned > 0) {
				const deviation = ((c.qdrValue - planned) / planned) * 100;
				if (Math.abs(deviation) > 5) {
					deviations.push({
						unidade: c.unit.name,
						data: dateStr ?? "",
						programado: planned,
						real: c.qdrValue,
						desvioPercent: `${deviation.toFixed(1)}%`,
					});
				}
			}
		}

		if (deviations.length > 0) {
			sections.push(
				`DESVIOS SIGNIFICATIVOS (>5%) ENTRE PROGRAMADO E REAL:\n${JSON.stringify(deviations.slice(0, 20), null, 2)}`,
			);
		}
	}

	// Add penalty configuration from contracts
	const contractsWithPenalties = contracts.filter(
		(c) => c.penaltyForUnderConsumption || c.penaltyForOverConsumption || c.pvemaTolerancePercent,
	);
	if (contractsWithPenalties.length > 0) {
		const penaltyConfig = contractsWithPenalties.map((c) => ({
			contrato: c.name,
			penalSubconsumo: c.penaltyForUnderConsumption,
			penalSobreconsumo: c.penaltyForOverConsumption,
			metodoCalculo: c.penaltyCalculationMethod,
			toleranciaPVEMA: c.pvemaTolerancePercent,
			toleranciaPVEME: c.pvemeTolerancePercent,
			sobredemandaTeto1: c.overdemandTier1MaxPercent,
			sobredemandaTeto2: c.overdemandTier2MaxPercent,
			tarifaTUSD: c.tusdTariffPerUnit,
			cmcMinimoUso: c.cmcMinUsagePercent,
		}));
		sections.push(
			`CONFIGURACAO DE PENALIDADES:\n${JSON.stringify(penaltyConfig, null, 2)}`,
		);
	}

	return sections.join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `Voce e um assistente especializado em gestao de gas natural para a plataforma ProgramaGas.
Voce ajuda usuarios a entender seus contratos, consumo, programacao e penalidades.

REGRAS:
- Responda sempre em portugues brasileiro
- Seja conciso e direto
- Use dados reais fornecidos no contexto para respostas precisas
- Quando mencionar valores, use formatacao brasileira (1.000,50)
- Se nao tiver dados suficientes para responder, diga claramente
- Sugira navegar para paginas especificas quando relevante:
  - /gas - Dashboard principal
  - /gas/contracts - Contratos
  - /gas/scheduling - Programacao diaria
  - /gas/monthly-scheduling - Programacao mensal
  - /gas/actual-consumption - Consumo real
  - /gas/penalties - Penalidades
  - /gas/reports - Relatorios
  - /gas/deviation-alerts - Alertas de desvio

CAPACIDADES:
- Explicar termos do mercado de gas (QDC, QDS, QDP, QDR, take-or-pay, make-up gas, tolerancias)
- Comparar consumo real vs programado
- Identificar desvios e tendencias
- Explicar clausulas contratuais e penalidades
- Calcular estimativas de penalidades com base nos dados`;

export const gasChatController = new Elysia({
	prefix: "/gas-chat",
})
	.use(betterAuth)
	.post(
		"/",
		async ({ body, session }) => {
			const organizationId = session.activeOrganizationId;
			if (!organizationId) {
				return new Response("Organization not found", { status: 400 });
			}

			const context = await buildGasContext(organizationId);

			const result = streamText({
				model: gateway("anthropic/claude-sonnet-4-6"),
				system: `${SYSTEM_PROMPT}\n\nDADOS ATUAIS DO CLIENTE:\n\n${context}`,
				messages: body.messages.map((m) => ({
					role: m.role as "user" | "assistant",
					content: m.content,
				})),
				maxOutputTokens: 2048,
			});

			return result.toTextStreamResponse();
		},
		{
			auth: true,
			body: t.Object({
				messages: t.Array(MessageSchema),
			}),
		},
	);
