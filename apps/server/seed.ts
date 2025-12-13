import { authDb, db } from "@acme/zen-v3";

import { auth } from "./src/plugins/better-auth";

async function main() {
	console.log("🌱 Clearing database...");

	await Promise.all([
		db.user.deleteMany(),
		db.member.deleteMany(),
		db.organization.deleteMany(),
		db.todo.deleteMany(),
		db.session.deleteMany(),
		db.account.deleteMany(),
		db.verification.deleteMany(),
		db.invitation.deleteMany(),
	]);

	console.log("🌱 Seeding database...");

	const [aUser, bUser] = await Promise.all([
		auth.api.signUpEmail({
			body: {
				email: "a@a.com",
				password: "12345678",
				name: "User A",
			},
		}),
		auth.api.signUpEmail({
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
		db.member.createMany({
			data: [
				{
					userId: aUser.user.id,
					organizationId: orgA?.id ?? "",
					role: "admin",
				},
				{
					userId: bUser.user.id,
					organizationId: orgA?.id ?? "",
					role: "member",
				},
				{
					userId: aUser.user.id,
					organizationId: orgB?.id ?? "",
					role: "owner",
				},
				{
					userId: bUser.user.id,
					organizationId: orgB?.id ?? "",
					role: "member",
				},
			],
		}),
	]);

	console.log("🌱 Setting auth...");

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

	console.log("🌱 Database seeded successfully");
}

main();
