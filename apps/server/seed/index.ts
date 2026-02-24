import { authDb, db } from "@acme/zen-v3";

import { auth } from "../src/plugins/better-auth";
import { clearDatabase } from "./clear";
import { seedCore } from "./core";
import { seedGasContracts } from "./gas-contracts";
import { seedGasDailyData } from "./gas-daily";
import { seedGasUnits } from "./gas-units";

async function main() {
	await clearDatabase(db);

	const ctx = await seedCore(db, authDb, auth);

	const refs = await seedGasUnits(db, ctx.userDb, ctx);

	await seedGasContracts(ctx.userDb, ctx);

	await seedGasDailyData(db, ctx.userDb, refs);

	console.log("🎉 Database seeded successfully!");

	process.exit(0);
}

main().catch((error) => {
	console.error("❌ Seed failed:", error);
	process.exit(1);
});
