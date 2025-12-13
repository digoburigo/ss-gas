import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { ReactElement } from "react";
import { Resend } from "resend";

interface Props {
	emailTemplate: ReactElement;
	to: string | string[];
	subject: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

let TEST_EMAIL_USER: { user: string; pass: string } | null = null;

export async function sendEmail({ emailTemplate, to, subject }: Props) {
	const html = await render(emailTemplate);

	if (process.env.NODE_ENV === "production") {
		const { data, error } = await resend.emails.send({
			from: `Melomar Clínica <admin@${process.env.RESEND_DOMAIN}>`,
			to,
			subject,
			html,
		});

		if (error) {
			console.error(error);
		}
	} else {
		if (TEST_EMAIL_USER) {
			console.dir(
				{ user: TEST_EMAIL_USER.user, pass: TEST_EMAIL_USER.pass },
				{ depth: null },
			);
			await sendEmailWithTestAccount({
				to,
				subject,
				html,
				account: TEST_EMAIL_USER,
			});
			return;
		}

		// Using ethereal.email for testing (https://ethereal.email/)
		nodemailer.createTestAccount(async (err, account) => {
			if (err) {
				console.error(`Failed to create a testing account. ${err.message}`);
				return;
			}

			console.dir({ user: account.user, pass: account.pass }, { depth: null });

			TEST_EMAIL_USER = { user: account.user, pass: account.pass };

			await sendEmailWithTestAccount({
				to,
				subject,
				html,
				account,
			});
		});
	}
}

async function sendEmailWithTestAccount({
	to,
	subject,
	html,
	account,
}: {
	to: string | string[];
	subject: string;
	html: string;
	account: { user: string; pass: string };
}) {
	const smtpOptions: SMTPTransport.Options = {
		host: process.env.SMTP_HOST || "smtp.ethereal.email",
		port: Number.parseInt(process.env.SMTP_PORT || "587"),
		secure: false,
		// secure: true,
		// tls:{
		//   rejectUnauthorized: false
		// },
		auth: {
			user: process.env.SMTP_USER || account.user,
			pass: process.env.SMTP_PASSWORD || account.pass,
		},
	};

	const transporter = nodemailer.createTransport({
		...smtpOptions,
	});
	const options = {
		from: process.env.SMTP_FROM_EMAIL || account.user,
		to,
		subject,
		html,
	};

	await transporter.sendMail(options);
}
