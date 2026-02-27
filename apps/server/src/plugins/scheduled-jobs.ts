import { cron, Patterns } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { ContractAlertService, ScheduledJobsService } from "../services";

import { log } from "./logger";

/**
 * Scheduled jobs plugin for Elysia.
 * Sets up cron jobs for:
 * - 6 PM daily: Check for missing entries and alert unit operators
 * - 8 PM daily: Escalate missing entries to supervisors
 * - 9 AM daily: Process and dispatch contract alerts
 * - 10 AM daily: Retry failed alert deliveries
 */
export const scheduledJobs = new Elysia({ name: "scheduledJobs" })
	.use(
		cron({
			name: "checkMissingEntries",
			pattern: Patterns.everyDayAt("18:00"),
			timezone: "America/Sao_Paulo",
			async run() {
				log.info({ job: "checkMissingEntries" }, "Running scheduled job");
				try {
					await ScheduledJobsService.checkMissingEntriesAndAlert();
				} catch (error) {
					log.error({ job: "checkMissingEntries", err: error }, "Error in scheduled job");
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
				log.info({ job: "escalateMissingEntries" }, "Running scheduled job");
				try {
					await ScheduledJobsService.escalateMissingEntries();
				} catch (error) {
					log.error({ job: "escalateMissingEntries", err: error }, "Error in scheduled job");
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
				log.info({ job: "processContractAlerts" }, "Running scheduled job");
				try {
					const result = await ContractAlertService.processAndDispatchAlerts();
					log.info(
						{
							job: "processContractAlerts",
							totalAlerts: result.totalAlerts,
							sentEmails: result.sentEmails,
							totalEmails: result.totalEmails,
						},
						"Contract alerts processed",
					);
				} catch (error) {
					log.error({ job: "processContractAlerts", err: error }, "Error in scheduled job");
				}
			},
		})
	)
	.use(
		cron({
			name: "retryFailedAlerts",
			pattern: Patterns.everyDayAt("10:00"),
			timezone: "America/Sao_Paulo",
			async run() {
				log.info({ job: "retryFailedAlerts" }, "Running scheduled job");
				try {
					const result = await ContractAlertService.retryFailedAlerts();
					log.info(
						{
							job: "retryFailedAlerts",
							totalRetried: result.totalRetried,
							succeeded: result.succeeded,
							stillFailing: result.stillFailing,
						},
						"Failed alerts retried",
					);
				} catch (error) {
					log.error({ job: "retryFailedAlerts", err: error }, "Error in scheduled job");
				}
			},
		})
	);
