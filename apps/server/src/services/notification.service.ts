import { sendEmail } from "@acme/email";
import { MissingDailyEntryEmail } from "@acme/email/emails";

interface MissingEntryAlertParams {
	userName: string;
	userEmail: string;
	unitName: string;
	date: string;
	entryFormLink: string;
}

export const NotificationService = {
	async sendMissingEntryAlert({
		userName,
		userEmail,
		unitName,
		date,
		entryFormLink,
	}: MissingEntryAlertParams): Promise<void> {
		const emailTemplate = MissingDailyEntryEmail({
			userName,
			unitName,
			date,
			entryFormLink,
		});

		await sendEmail({
			emailTemplate,
			to: userEmail,
			subject: `Lançamento Diário Pendente - ${unitName} (${date})`,
		});
	},
};

export type { MissingEntryAlertParams };
