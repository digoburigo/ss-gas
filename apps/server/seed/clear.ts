import type { db as Db } from "@acme/zen-v3";

export async function clearDatabase(db: typeof Db): Promise<void> {
	console.log("🔥 Clearing database...");

	// Alert sent logs (FK → gasContractAlert)
	await db.gasAlertSentLog.deleteMany();

	// Alert recipients (FK → gasContractAlert)
	await db.gasContractAlertRecipient.deleteMany();

	// Contract alerts (FK → gasContract)
	await db.gasContractAlert.deleteMany();

	// Contract audit log (FK → gasContract)
	await db.gasContractAuditLog.deleteMany();

	// Unit ↔ Contract join table (FK → gasUnit + gasContract)
	await db.gasUnitContract.deleteMany();

	// Gas child tables first (FK order)
	await db.gasEquipmentConstant.deleteMany();
	await db.gasLineStatus.deleteMany();
	await db.gasDailyEntry.deleteMany();
	await db.gasDailyPlan.deleteMany();
	await db.gasRealConsumption.deleteMany();
	await db.gasEquipment.deleteMany();

	// Unit operators (FK → member + gasUnit — must come before gasUnit and member)
	await db.gasUnitOperator.deleteMany();

	await db.gasUnit.deleteMany();
	await db.gasContract.deleteMany();

	// Org-scoped parameter tables (FK → organization)
	await db.gasSystemParameter.deleteMany();
	await db.gasContractTemplate.deleteMany();
	await db.gasCustomField.deleteMany();

	// Audit log (no FK deps on org data)
	await db.gasAuditLog.deleteMany();

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
