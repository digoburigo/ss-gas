export const DEVIATION_CAUSES = [
	{ cause: "weather", weight: 25, label: "Clima" },
	{ cause: "production", weight: 20, label: "Produção" },
	{ cause: "maintenance", weight: 15, label: "Manutenção" },
	{ cause: "demand_spike", weight: 10, label: "Pico de Demanda" },
	{ cause: "demand_drop", weight: 10, label: "Queda de Demanda" },
	{ cause: "equipment_issue", weight: 10, label: "Problema de Equipamento" },
	{ cause: "scheduling_error", weight: 5, label: "Erro de Programação" },
	{ cause: "other", weight: 5, label: "Outro" },
];

export function getDateRange(days: number): Date[] {
	const dates: Date[] = [];
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		dates.push(date);
	}

	return dates;
}

export function randomVariation(base: number, percent: number): number {
	const variation = base * (percent / 100);
	return base + (Math.random() * 2 - 1) * variation;
}

export function selectWeightedCause(): string {
	const totalWeight = DEVIATION_CAUSES.reduce((sum, c) => sum + c.weight, 0);
	let random = Math.random() * totalWeight;

	for (const item of DEVIATION_CAUSES) {
		random -= item.weight;
		if (random <= 0) {
			return item.cause;
		}
	}

	return DEVIATION_CAUSES[DEVIATION_CAUSES.length - 1].cause;
}
