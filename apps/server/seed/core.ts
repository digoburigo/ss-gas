import type { authDb as AuthDb, db as Db } from "@acme/zen-v3";
import type { auth } from "../src/plugins/better-auth";

export interface CoreContext {
	org: { id: string; name: string; slug: string };
	user: { id: string };
	bUserMemberId: string;
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any;
}

export async function seedCore(
	db: typeof Db,
	authDb: typeof AuthDb,
	authInstance: typeof auth,
): Promise<CoreContext> {
	console.log("🌱 Seeding core data...");

	const [aUser, bUser] = await Promise.all([
		authInstance.api.signUpEmail({
			body: {
				email: "a@a.com",
				password: "12345678",
				name: "User A",
			},
		}),
		authInstance.api.signUpEmail({
			body: {
				email: "b@b.com",
				password: "12345678",
				name: "User B",
			},
		}),
	]);

	const [orgA, orgB] = await db.organization.createManyAndReturn({
		data: [
			{ name: "Org A", slug: "org-a" },
			{ name: "Org B", slug: "org-b" },
		],
	});

	await Promise.all([
		db.user.update({
			where: { id: aUser.user.id },
			data: { role: "admin", emailVerified: true },
		}),
		db.user.update({
			where: { id: bUser.user.id },
			data: { role: "member", emailVerified: true },
		}),
	]);

	// Create members and capture IDs (needed for GasUnitOperator assignments)
	const members = await db.member.createManyAndReturn({
		data: [
			{
				userId: aUser.user.id,
				organizationId: orgA?.id ?? "",
				role: "admin",
				profile: "admin",
			},
			{
				userId: bUser.user.id,
				organizationId: orgA?.id ?? "",
				role: "member",
				profile: "operator",
			},
			{
				userId: aUser.user.id,
				organizationId: orgB?.id ?? "",
				role: "owner",
				profile: "manager",
			},
			{
				userId: bUser.user.id,
				organizationId: orgB?.id ?? "",
				role: "member",
				profile: "viewer",
			},
		],
	});

	const bUserMemberInOrgA = members.find(
		(m) => m.userId === bUser.user.id && m.organizationId === (orgA?.id ?? ""),
	);

	const userDb = authDb.$setAuth({
		userId: aUser.user.id,
		organizationId: orgA?.id ?? "",
		organizationRole: "admin",
		role: "admin",
	} as any);

	console.log("🌱 Creating todo...");
	await userDb.todo.create({
		data: {
			title: "Todo 1",
		},
	});

	// Notification preferences for both users
	console.log("🔔 Creating notification preferences...");
	await db.userNotificationPreferences.createMany({
		data: [
			{
				userId: aUser.user.id,
				missingEntryAlertsEnabled: true,
				preferredNotificationHour: 18,
				escalationEnabled: true,
				escalationDelayHours: 2,
			},
			{
				userId: bUser.user.id,
				missingEntryAlertsEnabled: true,
				preferredNotificationHour: 9,
				escalationEnabled: false,
				escalationDelayHours: 4,
			},
		],
	});

	console.log("✅ Core data seeded");

	return {
		org: orgA ?? { id: "", name: "Org A", slug: "org-a" },
		user: { id: aUser.user.id },
		bUserMemberId: bUserMemberInOrgA?.id ?? "",
		userDb,
	};
}
