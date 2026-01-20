import Anthropic from "@anthropic-ai/sdk";
import { Elysia, t } from "elysia";

import { betterAuth } from "../../plugins/better-auth";

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Schema for extracted contract field with confidence
 */
const ExtractedFieldSchema = t.Object({
	value: t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]),
	confidence: t.Number({ minimum: 0, maximum: 1 }),
	source: t.Optional(t.String()),
});

/**
 * Schema for extracted contract data
 */
const ExtractedContractSchema = t.Object({
	// Basic Data
	name: ExtractedFieldSchema,
	contractNumber: ExtractedFieldSchema,
	supplier: ExtractedFieldSchema,
	supplierCnpj: ExtractedFieldSchema,

	// Volumes and Flexibilities
	qdcContracted: ExtractedFieldSchema,
	volumeUnit: ExtractedFieldSchema,
	transportToleranceUpperPercent: ExtractedFieldSchema,
	transportToleranceLowerPercent: ExtractedFieldSchema,
	moleculeTolerancePercent: ExtractedFieldSchema,
	takeOrPayPercent: ExtractedFieldSchema,
	takeOrPayAccumulationMonths: ExtractedFieldSchema,
	takeOrPayExpirationMonths: ExtractedFieldSchema,
	makeUpGasEnabled: ExtractedFieldSchema,
	makeUpGasExpirationMonths: ExtractedFieldSchema,
	makeUpGasMaxPercent: ExtractedFieldSchema,
	flexibilityUpPercent: ExtractedFieldSchema,
	flexibilityDownPercent: ExtractedFieldSchema,
	seasonalFlexibility: ExtractedFieldSchema,

	// Prices and Adjustments
	basePricePerUnit: ExtractedFieldSchema,
	priceCurrency: ExtractedFieldSchema,
	adjustmentIndex: ExtractedFieldSchema,
	adjustmentFrequency: ExtractedFieldSchema,
	adjustmentBaseDate: ExtractedFieldSchema,
	nextAdjustmentDate: ExtractedFieldSchema,
	transportCostPerUnit: ExtractedFieldSchema,
	taxesIncluded: ExtractedFieldSchema,

	// Penalties
	penaltyForUnderConsumption: ExtractedFieldSchema,
	penaltyForOverConsumption: ExtractedFieldSchema,
	penaltyCalculationMethod: ExtractedFieldSchema,
	latePaymentPenaltyPercent: ExtractedFieldSchema,
	latePaymentInterestPercent: ExtractedFieldSchema,

	// Important Events/Dates
	effectiveFrom: ExtractedFieldSchema,
	effectiveTo: ExtractedFieldSchema,
	renewalDate: ExtractedFieldSchema,
	renewalNoticeDays: ExtractedFieldSchema,
	dailySchedulingDeadline: ExtractedFieldSchema,
	monthlyDeclarationDeadline: ExtractedFieldSchema,

	// General
	notes: ExtractedFieldSchema,
});

const SYSTEM_PROMPT = `Você é um especialista em extração de dados de contratos de fornecimento de gás natural no Brasil.
Sua tarefa é analisar documentos de contratos (PDF convertido em texto ou imagens) e extrair informações estruturadas.

Para cada campo, você deve fornecer:
1. O valor extraído (ou null se não encontrado)
2. Um nível de confiança entre 0 e 1 (1 = muito confiante, 0 = não encontrado)
3. A fonte/trecho do documento onde a informação foi encontrada (opcional)

Regras importantes:
- Se um valor não for encontrado claramente no documento, defina confidence como 0 e value como null
- Se o valor for inferido ou ambíguo, use confidence entre 0.3 e 0.7
- Se o valor for claramente encontrado no documento, use confidence entre 0.8 e 1.0
- Para datas, use o formato YYYY-MM-DD
- Para horários (dailySchedulingDeadline), use o formato HH:mm
- Para percentuais, use números sem o símbolo %
- Para valores monetários, use números sem símbolos de moeda
- A moeda padrão é BRL (Real Brasileiro)
- O volume padrão é m3 (metros cúbicos)

Campos que você deve extrair:

DADOS BÁSICOS:
- name: Nome ou título do contrato
- contractNumber: Número do contrato
- supplier: Nome do fornecedor/distribuidora
- supplierCnpj: CNPJ do fornecedor

VOLUMES E FLEXIBILIDADES:
- qdcContracted: Quantidade Diária Contratada (QDC) em m³/dia
- volumeUnit: Unidade de volume (m3, mmbtu, gj)
- transportToleranceUpperPercent: Tolerância de transporte superior (%)
- transportToleranceLowerPercent: Tolerância de transporte inferior (%)
- moleculeTolerancePercent: Tolerância de molécula (%)
- takeOrPayPercent: Percentual de take-or-pay (%)
- takeOrPayAccumulationMonths: Meses de acumulação do take-or-pay
- takeOrPayExpirationMonths: Meses para expiração do crédito take-or-pay
- makeUpGasEnabled: Se make-up gas está habilitado (true/false)
- makeUpGasExpirationMonths: Meses para expiração do make-up gas
- makeUpGasMaxPercent: Percentual máximo de recuperação do make-up gas
- flexibilityUpPercent: Flexibilidade para cima (%)
- flexibilityDownPercent: Flexibilidade para baixo (%)
- seasonalFlexibility: Se há flexibilidade sazonal (true/false)

PREÇOS E REAJUSTES:
- basePricePerUnit: Preço base por unidade de volume
- priceCurrency: Moeda (BRL, USD)
- adjustmentIndex: Índice de reajuste (IGPM, IPCA, outro)
- adjustmentFrequency: Frequência de reajuste (mensal, trimestral, anual)
- adjustmentBaseDate: Data base do reajuste (YYYY-MM-DD)
- nextAdjustmentDate: Data do próximo reajuste (YYYY-MM-DD)
- transportCostPerUnit: Custo de transporte por unidade
- taxesIncluded: Se impostos estão inclusos (true/false)

PENALIDADES:
- penaltyForUnderConsumption: Multa por subconsumo (R$/unidade)
- penaltyForOverConsumption: Multa por sobreconsumo (R$/unidade)
- penaltyCalculationMethod: Descrição do método de cálculo das penalidades
- latePaymentPenaltyPercent: Multa por atraso no pagamento (%)
- latePaymentInterestPercent: Juros de mora mensal (%)

DATAS IMPORTANTES:
- effectiveFrom: Data de início do contrato (YYYY-MM-DD)
- effectiveTo: Data de término do contrato (YYYY-MM-DD)
- renewalDate: Data limite para renovação (YYYY-MM-DD)
- renewalNoticeDays: Dias de antecedência para notificação de renovação
- dailySchedulingDeadline: Horário limite para programação diária (HH:mm)
- monthlyDeclarationDeadline: Dia do mês para declaração mensal (1-31)

GERAL:
- notes: Observações relevantes encontradas no contrato

Retorne APENAS um objeto JSON válido com a estrutura especificada, sem nenhum texto adicional.`;

export const contractExtractionController = new Elysia({
	prefix: "/contract-extraction",
})
	.use(betterAuth)

	/**
	 * POST /contract-extraction/extract
	 *
	 * Extracts contract data from uploaded file using AI.
	 * Accepts either base64 encoded file content or file URL.
	 */
	.post(
		"/extract",
		async ({ body, status }) => {
			const { fileUrl, fileBase64, fileType, fileName } = body;

			if (!fileUrl && !fileBase64) {
				return status(400, {
					error: "Either fileUrl or fileBase64 must be provided",
				});
			}

			try {
				let content: Anthropic.Messages.ContentBlockParam[];

				if (fileBase64) {
					// Handle base64 encoded file
					const mediaType = fileType.startsWith("image/")
						? (fileType as
								| "image/jpeg"
								| "image/png"
								| "image/gif"
								| "image/webp")
						: "application/pdf";

					if (mediaType === "application/pdf") {
						// For PDFs, we need to use document type
						content = [
							{
								type: "document",
								source: {
									type: "base64",
									media_type: "application/pdf",
									data: fileBase64,
								},
							},
							{
								type: "text",
								text: `Analise este contrato de gás natural e extraia todos os campos especificados.
Nome do arquivo: ${fileName}

Retorne apenas o JSON com os campos extraídos e seus níveis de confiança.`,
							},
						];
					} else {
						// For images
						content = [
							{
								type: "image",
								source: {
									type: "base64",
									media_type: mediaType,
									data: fileBase64,
								},
							},
							{
								type: "text",
								text: `Analise esta imagem de um contrato de gás natural e extraia todos os campos especificados.
Nome do arquivo: ${fileName}

Retorne apenas o JSON com os campos extraídos e seus níveis de confiança.`,
							},
						];
					}
				} else if (fileUrl) {
					// Handle URL - fetch and convert to base64
					const response = await fetch(fileUrl);
					const arrayBuffer = await response.arrayBuffer();
					const base64 = Buffer.from(arrayBuffer).toString("base64");

					const contentType =
						response.headers.get("content-type") || "application/pdf";
					const mediaType = contentType.startsWith("image/")
						? (contentType as
								| "image/jpeg"
								| "image/png"
								| "image/gif"
								| "image/webp")
						: "application/pdf";

					if (mediaType === "application/pdf") {
						content = [
							{
								type: "document",
								source: {
									type: "base64",
									media_type: "application/pdf",
									data: base64,
								},
							},
							{
								type: "text",
								text: `Analise este contrato de gás natural e extraia todos os campos especificados.
URL do arquivo: ${fileUrl}

Retorne apenas o JSON com os campos extraídos e seus níveis de confiança.`,
							},
						];
					} else {
						content = [
							{
								type: "image",
								source: {
									type: "base64",
									media_type: mediaType,
									data: base64,
								},
							},
							{
								type: "text",
								text: `Analise esta imagem de um contrato de gás natural e extraia todos os campos especificados.
URL do arquivo: ${fileUrl}

Retorne apenas o JSON com os campos extraídos e seus níveis de confiança.`,
							},
						];
					}
				} else {
					return status(400, { error: "No file provided" });
				}

				const message = await anthropic.messages.create({
					model: "claude-sonnet-4-20250514",
					max_tokens: 8192,
					system: SYSTEM_PROMPT,
					messages: [
						{
							role: "user",
							content,
						},
					],
				});

				// Extract JSON from response
				const responseText =
					message.content[0]?.type === "text" ? message.content[0].text : "";

				// Try to parse JSON from response
				let extractedData: Record<string, unknown>;
				try {
					// Remove any markdown code blocks if present
					const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
					const jsonString = jsonMatch ? jsonMatch[1] : responseText;
					extractedData = JSON.parse(jsonString?.trim() || "{}");
				} catch {
					console.error("Failed to parse AI response:", responseText);
					return status(500, {
						error: "Failed to parse AI extraction response",
						rawResponse: responseText,
					});
				}

				return {
					success: true,
					extractedData,
					usage: {
						inputTokens: message.usage.input_tokens,
						outputTokens: message.usage.output_tokens,
					},
				};
			} catch (error) {
				console.error("Contract extraction error:", error);
				return status(500, {
					error:
						error instanceof Error ? error.message : "Unknown error occurred",
				});
			}
		},
		{
			auth: true,
			body: t.Object({
				fileUrl: t.Optional(t.String()),
				fileBase64: t.Optional(t.String()),
				fileType: t.String(),
				fileName: t.String(),
			}),
			response: {
				200: t.Object({
					success: t.Boolean(),
					extractedData: t.Record(t.String(), t.Unknown()),
					usage: t.Object({
						inputTokens: t.Number(),
						outputTokens: t.Number(),
					}),
				}),
				400: t.Object({
					error: t.String(),
				}),
				500: t.Object({
					error: t.String(),
					rawResponse: t.Optional(t.String()),
				}),
			},
		},
	);
