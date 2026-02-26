import type { db as Db } from "@acme/zen-v3";

export async function clearDatabase(db: typeof Db): Promise<void> {
	console.log("🔥 Clearing database...");

	// Audit log (no FK deps)
	await db.gasAuditLog.deleteMany();

	// Gas child tables first (FK order)
	await db.gasEquipmentConstant.deleteMany();
	await db.gasLineStatus.deleteMany();
	await db.gasDailyEntry.deleteMany();
	await db.gasDailyPlan.deleteMany();
	await db.gasRealConsumption.deleteMany();
	await db.gasEquipment.deleteMany();
	await db.gasUnit.deleteMany();
	await db.gasContract.deleteMany();

	// Core tables
	await Promise.all([
		db.todo.deleteMany(),
		db.invitation.deleteMany(),
		db.member.deleteMany(),
	]);
	await Promise.all([
		db.session.deleteMany(),
		db.account.deleteMany(),
		db.verification.deleteMany(),
	]);
	await db.organization.deleteMany();
	await db.user.deleteMany();
}
