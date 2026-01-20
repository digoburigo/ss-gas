import { cron, Patterns } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { ContractAlertService, ScheduledJobsService } from "../services";

/**
 * Scheduled jobs plugin for Elysia.
 * Sets up cron jobs for:
 * - 6 PM daily: Check for missing entries and alert unit operators
 * - 8 PM daily: Escalate missing entries to supervisors
 * - 9 AM daily: Process and dispatch contract alerts
 */
export const scheduledJobs = new Elysia({ name: "scheduledJobs" })
	.use(
		cron({
			name: "checkMissingEntries",
			pattern: Patterns.everyDayAt("18:00"),
			timezone: "America/Sao_Paulo",
			async run() {
				console.log(
					`[${new Date().toISOString()}] Running scheduled job: checkMissingEntries`
				);
				try {
					await ScheduledJobsService.checkMissingEntriesAndAlert();
				} catch (error) {
					console.error(
						`[${new Date().toISOString()}] Error in checkMissingEntries job:`,
						error
					);
				}
			},
		})
	)
	.use(
		cron({
			name: "escalateMissingEntries",
			pattern: Patterns.everyDayAt("20:00"),
			timezone: "America/Sao_Paulo",
			async run() {
				console.log(
					`[${new Date().toISOString()}] Running scheduled job: escalateMissingEntries`
				);
				try {
					await ScheduledJobsService.escalateMissingEntries();
				} catch (error) {
					console.error(
						`[${new Date().toISOString()}] Error in escalateMissingEntries job:`,
						error
					);
				}
			},
		})
	)
	.use(
		cron({
			name: "processContractAlerts",
			pattern: Patterns.everyDayAt("09:00"),
			timezone: "America/Sao_Paulo",
			async run() {
				console.log(
					`[${new Date().toISOString()}] Running scheduled job: processContractAlerts`
				);
				try {
					const result =
						await ContractAlertService.processAndDispatchAlerts();
					console.log(
						`[${new Date().toISOString()}] Contract alerts processed: ${result.totalAlerts} alerts, ${result.sentEmails}/${result.totalEmails} emails sent`
					);
				} catch (error) {
					console.error(
						`[${new Date().toISOString()}] Error in processContractAlerts job:`,
						error
					);
				}
			},
		})
	);
