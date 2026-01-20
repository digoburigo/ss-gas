import { db } from "@acme/zen-v3";
import { NotificationService } from "./notification.service";

const APP_URL = process.env.PUBLIC_WEB_URL ?? "http://localhost:3001";

interface JobExecutionLog {
	jobName: string;
	executedAt: Date;
	status: "success" | "error";
	message: string;
	details?: Record<string, unknown>;
}

// In-memory log for job executions (could be persisted to DB if needed)
const jobExecutionLogs: JobExecutionLog[] = [];

function logJobExecution(log: JobExecutionLog) {
	jobExecutionLogs.push(log);
	console.log(
		`[${log.executedAt.toISOString()}] [${log.jobName}] [${log.status}] ${log.message}`,
		log.details ? JSON.stringify(log.details) : ""
	);
}

export function getJobExecutionLogs(): JobExecutionLog[] {
	return [...jobExecutionLogs];
}

interface UnitWithMissingEntry {
	unitId: string;
	unitName: string;
	unitCode: string;
	organizationId: string;
}

async function getUnitsWithMissingEntries(
	date: Date
): Promise<UnitWithMissingEntry[]> {
	// Get all active units
	const allUnits = await db.gasUnit.findMany({
		where: { active: true },
		select: {
			id: true,
			name: true,
			code: true,
			organizationId: true,
		},
	});

	// Get units that have entries for today
	const unitsWithEntries = await db.gasDailyEntry.findMany({
		where: {
			date: date,
		},
		select: {
			unitId: true,
		},
	});

	const unitsWithEntryIds = new Set(unitsWithEntries.map((e) => e.unitId));

	// Return units that don't have entries
	return allUnits
		.filter((unit) => !unitsWithEntryIds.has(unit.id))
		.map((unit) => ({
			unitId: unit.id,
			unitName: unit.name,
			unitCode: unit.code,
			organizationId: unit.organizationId ?? "",
		}))
		.filter((unit) => unit.organizationId !== "");
}

interface OrganizationMember {
	userId: string;
	userName: string;
	userEmail: string;
	role: string;
}

async function getOrganizationMembers(
	organizationId: string
): Promise<OrganizationMember[]> {
	const members = await db.member.findMany({
		where: { organizationId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	});

	return members.map((member) => ({
		userId: member.user.id,
		userName: member.user.name,
		userEmail: member.user.email,
		role: member.role,
	}));
}

function formatDateBR(date: Date): string {
	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export const ScheduledJobsService = {
	/**
	 * Check for missing daily entries and send alerts to unit operators.
	 * This job should run at 6 PM daily.
	 */
	async checkMissingEntriesAndAlert(): Promise<void> {
		const jobName = "checkMissingEntriesAndAlert";
		const executedAt = new Date();

		try {
			// Get today's date (date only, no time)
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const unitsWithMissingEntries = await getUnitsWithMissingEntries(today);

			if (unitsWithMissingEntries.length === 0) {
				logJobExecution({
					jobName,
					executedAt,
					status: "success",
					message: "No missing entries found. All units have submitted their daily entries.",
				});
				return;
			}

			const dateFormatted = formatDateBR(today);
			let alertsSent = 0;
			const alertDetails: Array<{
				unit: string;
				usersNotified: string[];
			}> = [];

			for (const unit of unitsWithMissingEntries) {
				// Get all members of the organization (operators)
				const members = await getOrganizationMembers(unit.organizationId);

				// Filter to get non-admin members (operators) for initial alert
				const operators = members.filter(
					(m) => m.role === "member" || m.role === "operator"
				);

				// If no operators found, notify all members
				const usersToNotify = operators.length > 0 ? operators : members;

				const notifiedUsers: string[] = [];
				for (const user of usersToNotify) {
					try {
						await NotificationService.sendMissingEntryAlert({
							userName: user.userName,
							userEmail: user.userEmail,
							unitName: unit.unitName,
							date: dateFormatted,
							entryFormLink: `${APP_URL}/gas/units/${unit.unitId}/entry`,
						});
						alertsSent++;
						notifiedUsers.push(user.userEmail);
					} catch (emailError) {
						console.error(
							`Failed to send alert to ${user.userEmail}:`,
							emailError
						);
					}
				}

				alertDetails.push({
					unit: `${unit.unitCode} - ${unit.unitName}`,
					usersNotified: notifiedUsers,
				});
			}

			logJobExecution({
				jobName,
				executedAt,
				status: "success",
				message: `Sent ${alertsSent} alerts for ${unitsWithMissingEntries.length} units with missing entries`,
				details: { alertDetails },
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			logJobExecution({
				jobName,
				executedAt,
				status: "error",
				message: `Job failed: ${errorMessage}`,
			});
			throw error;
		}
	},

	/**
	 * Escalation check for missing entries. Sends alerts to supervisors/admins.
	 * This job should run at 8 PM daily (2 hours after initial alert).
	 */
	async escalateMissingEntries(): Promise<void> {
		const jobName = "escalateMissingEntries";
		const executedAt = new Date();

		try {
			// Get today's date (date only, no time)
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const unitsWithMissingEntries = await getUnitsWithMissingEntries(today);

			if (unitsWithMissingEntries.length === 0) {
				logJobExecution({
					jobName,
					executedAt,
					status: "success",
					message: "No missing entries to escalate. All units have submitted their daily entries.",
				});
				return;
			}

			const dateFormatted = formatDateBR(today);
			let alertsSent = 0;
			const escalationDetails: Array<{
				unit: string;
				supervisorsNotified: string[];
			}> = [];

			for (const unit of unitsWithMissingEntries) {
				// Get all members of the organization
				const members = await getOrganizationMembers(unit.organizationId);

				// Filter to get admins/supervisors for escalation
				const supervisors = members.filter(
					(m) => m.role === "admin" || m.role === "owner" || m.role === "supervisor"
				);

				// If no supervisors found, skip escalation for this unit
				if (supervisors.length === 0) {
					continue;
				}

				const notifiedSupervisors: string[] = [];
				for (const supervisor of supervisors) {
					try {
						await NotificationService.sendMissingEntryAlert({
							userName: supervisor.userName,
							userEmail: supervisor.userEmail,
							unitName: `${unit.unitName} (ESCALAÇÃO)`,
							date: dateFormatted,
							entryFormLink: `${APP_URL}/gas/units/${unit.unitId}/entry`,
						});
						alertsSent++;
						notifiedSupervisors.push(supervisor.userEmail);
					} catch (emailError) {
						console.error(
							`Failed to send escalation alert to ${supervisor.userEmail}:`,
							emailError
						);
					}
				}

				escalationDetails.push({
					unit: `${unit.unitCode} - ${unit.unitName}`,
					supervisorsNotified: notifiedSupervisors,
				});
			}

			logJobExecution({
				jobName,
				executedAt,
				status: "success",
				message: `Sent ${alertsSent} escalation alerts for ${unitsWithMissingEntries.length} units still missing entries`,
				details: { escalationDetails },
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			logJobExecution({
				jobName,
				executedAt,
				status: "error",
				message: `Job failed: ${errorMessage}`,
			});
			throw error;
		}
	},
};

export type { JobExecutionLog };
