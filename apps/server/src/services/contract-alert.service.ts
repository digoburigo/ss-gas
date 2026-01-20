import { sendEmail } from "@acme/email";
import { ContractAlertEmail } from "@acme/email/emails";
import { db } from "@acme/zen-v3";
import type {
	GasAlertEventType,
	GasAlertRecurrence,
} from "@acme/zen-v3/zenstack/models";

const APP_URL = process.env.PUBLIC_WEB_URL ?? "http://localhost:3001";

interface AlertWithDetails {
	id: string;
	contractId: string;
	eventType: GasAlertEventType;
	eventName: string;
	eventDescription: string | null;
	eventDate: Date | null;
	eventTime: string | null;
	recurrence: GasAlertRecurrence;
	advanceNoticeDays: number[];
	active: boolean;
	organizationId: string | null;
	contract: {
		id: string;
		name: string;
		units: Array<{
			id: string;
			name: string;
		}>;
	};
	recipients: Array<{
		id: string;
		email: string;
		name: string | null;
	}>;
}

// Map event types to required actions
const eventTypeActions: Record<GasAlertEventType, string> = {
	contract_expiration:
		"Verifique as condições de renovação e inicie negociações se necessário.",
	renewal_deadline:
		"Entre em contato com o fornecedor para iniciar o processo de renovação.",
	daily_scheduling:
		"Realize a programação diária de consumo de gás dentro do prazo.",
	monthly_declaration:
		"Submeta a declaração mensal de consumo junto à distribuidora.",
	adjustment_date:
		"Revise os novos valores e atualize o planejamento financeiro.",
	take_or_pay_expiration:
		"Avalie o saldo de take-or-pay e planeje o consumo para evitar perdas.",
	make_up_gas_expiration:
		"Verifique o saldo de make-up gas e planeje o resgate antes do vencimento.",
	custom:
		"Verifique os detalhes do evento e tome as ações necessárias conforme o contrato.",
};

function formatDateBR(date: Date): string {
	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function getNextOccurrence(
	baseDate: Date,
	recurrence: GasAlertRecurrence
): Date {
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	const targetDate = new Date(baseDate);
	targetDate.setHours(0, 0, 0, 0);

	if (recurrence === "once") {
		return targetDate;
	}

	// For recurring events, calculate the next occurrence
	while (targetDate < now) {
		switch (recurrence) {
			case "daily":
				targetDate.setDate(targetDate.getDate() + 1);
				break;
			case "weekly":
				targetDate.setDate(targetDate.getDate() + 7);
				break;
			case "monthly":
				targetDate.setMonth(targetDate.getMonth() + 1);
				break;
			case "yearly":
				targetDate.setFullYear(targetDate.getFullYear() + 1);
				break;
		}
	}

	return targetDate;
}

function getDaysUntil(eventDate: Date): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	const target = new Date(eventDate);
	target.setHours(0, 0, 0, 0);

	const diffTime = target.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return diffDays;
}

interface SendAlertResult {
	alertId: string;
	email: string;
	status: "sent" | "failed";
	errorMessage?: string;
}

export const ContractAlertService = {
	/**
	 * Get all active alerts that are due to be sent based on their advance notice days
	 */
	async getAlertsDueForDispatch(): Promise<
		Array<{ alert: AlertWithDetails; advanceNoticeDays: number }>
	> {
		const alerts = await db.gasContractAlert.findMany({
			where: {
				active: true,
				eventDate: { not: null },
			},
			include: {
				contract: {
					select: {
						id: true,
						name: true,
						units: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				recipients: {
					select: {
						id: true,
						email: true,
						name: true,
					},
				},
			},
		});

		const alertsDue: Array<{
			alert: AlertWithDetails;
			advanceNoticeDays: number;
		}> = [];

		for (const alert of alerts) {
			if (!alert.eventDate) continue;

			const nextOccurrence = getNextOccurrence(
				alert.eventDate,
				alert.recurrence as GasAlertRecurrence
			);
			const daysUntil = getDaysUntil(nextOccurrence);

			// Check if any of the advance notice days match
			for (const advanceDays of alert.advanceNoticeDays) {
				if (daysUntil === advanceDays) {
					// Check if we already sent this alert today for this advance period
					const today = new Date();
					today.setHours(0, 0, 0, 0);

					const tomorrow = new Date(today);
					tomorrow.setDate(tomorrow.getDate() + 1);

					const alreadySent = await db.gasAlertSentLog.findFirst({
						where: {
							alertId: alert.id,
							advanceNoticeDays: advanceDays,
							sentAt: {
								gte: today,
								lt: tomorrow,
							},
						},
					});

					if (!alreadySent) {
						alertsDue.push({
							alert: alert as AlertWithDetails,
							advanceNoticeDays: advanceDays,
						});
					}
					break; // Only send once per alert per day
				}
			}
		}

		return alertsDue;
	},

	/**
	 * Send a single alert email to a recipient
	 */
	async sendAlertEmail(
		alert: AlertWithDetails,
		recipientEmail: string,
		recipientName: string | null,
		advanceNoticeDays: number
	): Promise<SendAlertResult> {
		try {
			const eventDate = alert.eventDate
				? getNextOccurrence(
						alert.eventDate,
						alert.recurrence as GasAlertRecurrence
					)
				: new Date();

			const unitName =
				alert.contract.units.length > 0
					? alert.contract.units.map((u) => u.name).join(", ")
					: undefined;

			const requiredAction =
				eventTypeActions[alert.eventType as GasAlertEventType] ||
				eventTypeActions.custom;

			const emailTemplate = ContractAlertEmail({
				recipientName: recipientName ?? undefined,
				contractName: alert.contract.name,
				unitName,
				eventName: alert.eventName,
				eventDescription: alert.eventDescription ?? undefined,
				eventDate: formatDateBR(eventDate),
				advanceNoticeDays,
				requiredAction,
				contractLink: `${APP_URL}/gas/contracts?alertId=${alert.id}`,
			});

			await sendEmail({
				emailTemplate,
				to: recipientEmail,
				subject: `[SS-GAS] Alerta: ${alert.eventName} - ${alert.contract.name}`,
			});

			// Log the sent email
			await db.gasAlertSentLog.create({
				data: {
					alertId: alert.id,
					recipientEmail,
					advanceNoticeDays,
					status: "sent",
				},
			});

			return {
				alertId: alert.id,
				email: recipientEmail,
				status: "sent",
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			// Log the failed attempt
			await db.gasAlertSentLog.create({
				data: {
					alertId: alert.id,
					recipientEmail,
					advanceNoticeDays,
					status: "failed",
					errorMessage,
				},
			});

			return {
				alertId: alert.id,
				email: recipientEmail,
				status: "failed",
				errorMessage,
			};
		}
	},

	/**
	 * Process all due alerts and send emails to all recipients
	 * Returns a summary of sent emails
	 */
	async processAndDispatchAlerts(): Promise<{
		totalAlerts: number;
		totalEmails: number;
		sentEmails: number;
		failedEmails: number;
		details: Array<{
			alertName: string;
			contractName: string;
			advanceNoticeDays: number;
			results: SendAlertResult[];
		}>;
	}> {
		const alertsDue = await this.getAlertsDueForDispatch();

		const summary = {
			totalAlerts: alertsDue.length,
			totalEmails: 0,
			sentEmails: 0,
			failedEmails: 0,
			details: [] as Array<{
				alertName: string;
				contractName: string;
				advanceNoticeDays: number;
				results: SendAlertResult[];
			}>,
		};

		for (const { alert, advanceNoticeDays } of alertsDue) {
			const results: SendAlertResult[] = [];

			// Send individual email to each recipient (1 alert = 1 email per recipient)
			for (const recipient of alert.recipients) {
				summary.totalEmails++;

				const result = await this.sendAlertEmail(
					alert,
					recipient.email,
					recipient.name,
					advanceNoticeDays
				);

				results.push(result);

				if (result.status === "sent") {
					summary.sentEmails++;
				} else {
					summary.failedEmails++;
				}
			}

			summary.details.push({
				alertName: alert.eventName,
				contractName: alert.contract.name,
				advanceNoticeDays,
				results,
			});
		}

		return summary;
	},

	/**
	 * Get sent email logs for a specific alert
	 */
	async getSentLogsForAlert(
		alertId: string,
		limit = 50
	): Promise<
		Array<{
			id: string;
			recipientEmail: string;
			sentAt: Date;
			advanceNoticeDays: number;
			status: string;
			errorMessage: string | null;
		}>
	> {
		return db.gasAlertSentLog.findMany({
			where: { alertId },
			orderBy: { sentAt: "desc" },
			take: limit,
			select: {
				id: true,
				recipientEmail: true,
				sentAt: true,
				advanceNoticeDays: true,
				status: true,
				errorMessage: true,
			},
		});
	},
};
