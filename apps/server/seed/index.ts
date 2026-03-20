import { authDb, db } from "@acme/zen-v3";

import { auth } from "../src/plugins/better-auth";
import { clearDatabase } from "./clear";
import { seedCore } from "./core";
import { seedGasAudit } from "./gas-audit";
import { seedGasContractVersions } from "./gas-contract-versions";
import { seedGasContracts } from "./gas-contracts";
import { seedGasDailyData } from "./gas-daily";
import { seedGasParameters } from "./gas-parameters";
import { seedGasTariffHistory } from "./gas-tariff-history";
import { seedGasUnits } from "./gas-units";

async function main() {
	await clearDatabase(db);

	const ctx = await seedCore(db, authDb, auth);

	const refs = await seedGasUnits(db, ctx.userDb, ctx);

	const contractRefs = await seedGasContracts(ctx.userDb, ctx, refs);

	await seedGasTariffHistory(ctx.userDb, ctx, contractRefs);

	await seedGasContractVersions(ctx.userDb, ctx, contractRefs);

	await seedGasDailyData(db, ctx.userDb, refs, ctx);

	await seedGasParameters(ctx.userDb, ctx);

	await seedGasAudit(db, ctx, refs, contractRefs);

	console.log("🎉 Database seeded successfully!");

	process.exit(0);
}

main().catch((error) => {
	console.error("❌ Seed failed:", error);
	process.exit(1);
});
