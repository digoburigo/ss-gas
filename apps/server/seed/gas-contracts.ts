import type { CoreContext } from "./core";

export async function seedGasContracts(
	// biome-ignore lint/suspicious/noExplicitAny: $setAuth returns any
	userDb: any,
	ctx: CoreContext,
): Promise<void> {
	console.log("📜 Creating default contract...");

	await userDb.gasContract.create({
		data: {
			name: "Contrato Principal de Gás Natural",
			qdcContracted: 134800,
			transportToleranceUpperPercent: 10,
			transportToleranceLowerPercent: 20,
			moleculeTolerancePercent: 5,
			active: true,
			notes: "Contrato principal com tolerâncias padrão de transporte e molécula",
			organizationId: ctx.org.id,
		},
	});

	console.log("✅ Default contract created");
}
