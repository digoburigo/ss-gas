import { authDb, db } from "@acme/zen-v3";
import { Elysia, t } from "elysia";

import { betterAuth } from "../../plugins/better-auth";

/**
 * Schema for updating notification preferences
 */
const UpdateNotificationPreferencesSchema = t.Object({
	missingEntryAlertsEnabled: t.Optional(t.Boolean()),
	preferredNotificationHour: t.Optional(
		t.Number({ minimum: 0, maximum: 23 })
	),
	escalationEnabled: t.Optional(t.Boolean()),
	escalationDelayHours: t.Optional(t.Number({ minimum: 1, maximum: 24 })),
});

export const userController = new Elysia({ prefix: "/user" })
	.use(betterAuth)

	/**
	 * GET /user/notification-preferences
	 *
	 * Gets the current user's notification preferences.
	 * Creates default preferences if they don't exist.
	 */
	.get(
		"/notification-preferences",
		async ({ user }) => {
			// Try to find existing preferences
			let preferences = await db.userNotificationPreferences.findUnique({
				where: { userId: user.id },
			});

			// If no preferences exist, return default values
			if (!preferences) {
				return {
					missingEntryAlertsEnabled: true,
					preferredNotificationHour: 18,
					escalationEnabled: true,
					escalationDelayHours: 2,
				};
			}

			return {
				missingEntryAlertsEnabled: preferences.missingEntryAlertsEnabled,
				preferredNotificationHour: preferences.preferredNotificationHour,
				escalationEnabled: preferences.escalationEnabled,
				escalationDelayHours: preferences.escalationDelayHours,
			};
		},
		{
			auth: true,
			response: {
				200: t.Object({
					missingEntryAlertsEnabled: t.Boolean(),
					preferredNotificationHour: t.Number(),
					escalationEnabled: t.Boolean(),
					escalationDelayHours: t.Number(),
				}),
			},
		}
	)

	/**
	 * PUT /user/notification-preferences
	 *
	 * Updates the current user's notification preferences.
	 * Creates preferences if they don't exist (upsert).
	 */
	.put(
		"/notification-preferences",
		async ({ body, user }) => {
			// Upsert the preferences
			const preferences = await db.userNotificationPreferences.upsert({
				where: { userId: user.id },
				create: {
					userId: user.id,
					missingEntryAlertsEnabled: body.missingEntryAlertsEnabled ?? true,
					preferredNotificationHour: body.preferredNotificationHour ?? 18,
					escalationEnabled: body.escalationEnabled ?? true,
					escalationDelayHours: body.escalationDelayHours ?? 2,
				},
				update: {
					...(body.missingEntryAlertsEnabled !== undefined && {
						missingEntryAlertsEnabled: body.missingEntryAlertsEnabled,
					}),
					...(body.preferredNotificationHour !== undefined && {
						preferredNotificationHour: body.preferredNotificationHour,
					}),
					...(body.escalationEnabled !== undefined && {
						escalationEnabled: body.escalationEnabled,
					}),
					...(body.escalationDelayHours !== undefined && {
						escalationDelayHours: body.escalationDelayHours,
					}),
				},
			});

			return {
				missingEntryAlertsEnabled: preferences.missingEntryAlertsEnabled,
				preferredNotificationHour: preferences.preferredNotificationHour,
				escalationEnabled: preferences.escalationEnabled,
				escalationDelayHours: preferences.escalationDelayHours,
			};
		},
		{
			auth: true,
			body: UpdateNotificationPreferencesSchema,
			response: {
				200: t.Object({
					missingEntryAlertsEnabled: t.Boolean(),
					preferredNotificationHour: t.Number(),
					escalationEnabled: t.Boolean(),
					escalationDelayHours: t.Number(),
				}),
			},
		}
	);
