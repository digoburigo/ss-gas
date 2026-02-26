/**
 * Line status values matching the ZenStack LineStatusValue enum
 */
type LineStatusValue = "on" | "off";

/**
 * Equipment constant data for calculation
 */
interface EquipmentConstant {
	equipmentId: string;
	consumptionRate: number;
	consumptionUnit: "m3_per_hour" | "m3_per_day";
}

/**
 * Atomizer input data for QDC calculation
 */
interface AtomizerInput {
	scheduled: boolean;
	hours: number;
	consumptionRate: number;
	consumptionUnit: "m3_per_hour" | "m3_per_day";
}

/**
 * Line status with equipment constant for calculation
 */
interface LineWithStatus {
	equipmentId: string;
	status: LineStatusValue;
	consumptionRate: number;
	consumptionUnit: "m3_per_hour" | "m3_per_day";
}

/**
 * Contract tolerance bands
 */
interface ContractTolerances {
	qdcContracted: number;
	transportToleranceUpperPercent: number;
	transportToleranceLowerPercent: number;
	moleculeTolerancePercent: number;
}

/**
 * Deviation calculation result
 */
interface DeviationResult {
	// Transport deviation
	transportUpperLimit: number;
	transportLowerLimit: number;
	transportDeviation: number;
	transportDeviationPercent: number;
	transportStatus: "within" | "exceeded_upper" | "exceeded_lower";

	// Molecule deviation
	moleculeUpperLimit: number;
	moleculeLowerLimit: number;
	moleculeDeviation: number;
	moleculeDeviationPercent: number;
	moleculeStatus: "within" | "exceeded";
}

/**
 * Equipment input for QDP (daily planned quantity) calculation.
 * Each entry represents one piece of equipment with its ON/OFF status,
 * consumption rate, and planned operating hours for the day.
 */
interface QdpEquipmentInput {
	status: "on" | "off";
	consumptionRate: number;
	consumptionUnit: "m3_per_hour" | "m3_per_day";
	plannedHours: number;
}

/**
 * Daily entry consumption data for deviation calculation
 */
interface DailyConsumptionData {
	qdsCalculated: number;
	qdsManual?: number | null;
}

/**
 * CUSD contract penalty parameters
 */
interface CusdPenaltyParams {
	qdcContracted: number;
	pvemaTolerancePercent: number;
	pvemeTolerancePercent: number;
	overdemandTier1MaxPercent: number;
	overdemandTier2MaxPercent: number;
	overdemandTier2Multiplier: number;
	overdemandTier3Multiplier: number;
	tusdTariffPerUnit: number;
	basePricePerUnit: number;
}

/**
 * Result of daily penalty calculations
 */
interface DailyPenaltyResult {
	pvema: number;
	pveme: number;
	sobredemanda: number;
	total: number;
}

/**
 * Daily data point for monthly calculations
 */
interface MonthlyDayEntry {
	qdp: number;
	qdr: number;
}

/**
 * Result of monthly assertiveness/accuracy calculations
 */
interface MonthlyAccuracyResult {
	assertivenessRate: number;
	averageAccuracyRate: number;
	daysWithData: number;
	daysWithinTolerance: number;
}

/**
 * Gas Calculation Service
 *
 * Provides methods for calculating gas consumption metrics:
 * - QDC (Quantidade Diária Contratada) for atomizers
 * - QDC for production lines
 * - QDS (Quantidade Diária Solicitada) combining all consumption
 * - Contract deviations for transport and molecule tolerances
 */
export const GasCalculationService = {
	/**
	 * Calculate QDC for atomizer(s)
	 *
	 * Handles both single and dual atomizer scenarios.
	 * Formula: consumption_rate * hours_scheduled
	 *
	 * For dual atomizer units (like Botucatu), both atomizers are summed.
	 *
	 * @param primaryAtomizer - Primary atomizer input data
	 * @param secondaryAtomizer - Optional secondary atomizer input data
	 * @returns Total atomizer consumption in m³/day
	 */
	calculateQdcAtomizer(
		primaryAtomizer: AtomizerInput,
		secondaryAtomizer?: AtomizerInput,
	): number {
		let total = 0;

		if (primaryAtomizer.scheduled && primaryAtomizer.hours > 0) {
			const rate = normalizeToHourlyRate(
				primaryAtomizer.consumptionRate,
				primaryAtomizer.consumptionUnit,
			);
			total += rate * primaryAtomizer.hours;
		}

		if (secondaryAtomizer?.scheduled && secondaryAtomizer.hours > 0) {
			const rate = normalizeToHourlyRate(
				secondaryAtomizer.consumptionRate,
				secondaryAtomizer.consumptionUnit,
			);
			total += rate * secondaryAtomizer.hours;
		}

		return Math.round(total * 100) / 100;
	},

	/**
	 * Calculate QDC for production lines
	 *
	 * Sums consumption for all lines with status ON.
	 * Lines with status OFF are not included in the calculation.
	 *
	 * Formula: sum(consumption_rate * 24) for each ON line
	 * (Lines are assumed to run 24 hours when ON)
	 *
	 * @param lines - Array of lines with their status and consumption rates
	 * @returns Total lines consumption in m³/day
	 */
	calculateQdcLines(lines: LineWithStatus[]): number {
		const total = lines
			.filter((line) => line.status === "on")
			.reduce((sum, line) => {
				const rate = normalizeToHourlyRate(
					line.consumptionRate,
					line.consumptionUnit,
				);
				return sum + rate * 24;
			}, 0);

		return Math.round(total * 100) / 100;
	},

	/**
	 * Calculate QDS (Quantidade Diária Solicitada)
	 *
	 * Combines atomizer and lines consumption to get total daily request.
	 *
	 * @param qdcAtomizer - Atomizer consumption from calculateQdcAtomizer
	 * @param qdcLines - Lines consumption from calculateQdcLines
	 * @returns Total QDS in m³/day
	 */
	calculateQds(qdcAtomizer: number, qdcLines: number): number {
		return Math.round((qdcAtomizer + qdcLines) * 100) / 100;
	},

	/**
	 * Calculate QDP (Quantidade Diária Programada) from equipment statuses.
	 *
	 * Derives the daily planned gas consumption automatically from equipment
	 * ON/OFF status and consumption constants.
	 *
	 * Formula: sum of (consumptionRate_m3h × plannedHours) for each ON equipment.
	 *
	 * @param equipment - Array of equipment with status, rate, and planned hours
	 * @returns QDP value in m³/day, rounded to 2 decimal places
	 */
	calculateQdp(equipment: QdpEquipmentInput[]): number {
		const total = equipment
			.filter((e) => e.status === "on")
			.reduce((sum, e) => {
				const rate = normalizeToHourlyRate(
					e.consumptionRate,
					e.consumptionUnit,
				);
				return sum + rate * e.plannedHours;
			}, 0);

		return Math.round(total * 100) / 100;
	},

	/**
	 * Calculate contract deviations
	 *
	 * Computes transport and molecule tolerance deviations based on contract terms.
	 *
	 * Transport tolerance:
	 * - Upper limit: QDC + (QDC * upperPercent / 100)
	 * - Lower limit: QDC - (QDC * lowerPercent / 100)
	 *
	 * Molecule tolerance:
	 * - Upper/Lower: QDS ± (QDS * moleculePercent / 100)
	 *
	 * @param consumption - Daily consumption data (uses qdsManual if available, otherwise qdsCalculated)
	 * @param contract - Contract tolerance parameters
	 * @returns Deviation results with status indicators
	 */
	calculateDeviations(
		consumption: DailyConsumptionData,
		contract: ContractTolerances,
	): DeviationResult {
		const qds = consumption.qdsManual ?? consumption.qdsCalculated;
		const qdc = contract.qdcContracted;

		// Transport tolerance calculation
		const transportUpperLimit =
			qdc + (qdc * contract.transportToleranceUpperPercent) / 100;
		const transportLowerLimit =
			qdc - (qdc * contract.transportToleranceLowerPercent) / 100;
		const transportDeviation = qds - qdc;
		const transportDeviationPercent =
			qdc !== 0 ? (transportDeviation / qdc) * 100 : 0;

		let transportStatus: DeviationResult["transportStatus"] = "within";
		if (qds > transportUpperLimit) {
			transportStatus = "exceeded_upper";
		} else if (qds < transportLowerLimit) {
			transportStatus = "exceeded_lower";
		}

		// Molecule tolerance calculation (symmetric)
		const moleculeUpperLimit =
			qdc + (qdc * contract.moleculeTolerancePercent) / 100;
		const moleculeLowerLimit =
			qdc - (qdc * contract.moleculeTolerancePercent) / 100;
		const moleculeDeviation = qds - qdc;
		const moleculeDeviationPercent =
			qdc !== 0 ? (moleculeDeviation / qdc) * 100 : 0;

		const moleculeStatus: DeviationResult["moleculeStatus"] =
			qds > moleculeUpperLimit || qds < moleculeLowerLimit
				? "exceeded"
				: "within";

		return {
			transportUpperLimit: Math.round(transportUpperLimit * 100) / 100,
			transportLowerLimit: Math.round(transportLowerLimit * 100) / 100,
			transportDeviation: Math.round(transportDeviation * 100) / 100,
			transportDeviationPercent:
				Math.round(transportDeviationPercent * 100) / 100,
			transportStatus,

			moleculeUpperLimit: Math.round(moleculeUpperLimit * 100) / 100,
			moleculeLowerLimit: Math.round(moleculeLowerLimit * 100) / 100,
			moleculeDeviation: Math.round(moleculeDeviation * 100) / 100,
			moleculeDeviationPercent:
				Math.round(moleculeDeviationPercent * 100) / 100,
			moleculeStatus,
		};
	},

	/**
	 * Calculate PVEMA (Penalidade por Volume Excedente - Medição Acima)
	 *
	 * Penalty for daily consumption exceeding the upper transport tolerance.
	 * Formula: max(0, consumption - upperLimit) × basePricePerUnit
	 *
	 * Upper limit = QDC × (1 + pvemaTolerancePercent / 100)
	 */
	calculatePvema(consumption: number, params: CusdPenaltyParams): number {
		const upperLimit =
			params.qdcContracted * (1 + params.pvemaTolerancePercent / 100);
		const excess = Math.max(0, consumption - upperLimit);
		return round2(excess * params.basePricePerUnit);
	},

	/**
	 * Calculate PVEME (Penalidade por Volume Excedente - Medição abaixo)
	 *
	 * Penalty for daily consumption falling below the lower transport tolerance.
	 * Formula: max(0, lowerLimit - consumption) × basePricePerUnit
	 *
	 * Lower limit = QDC × (1 - pvemeTolerancePercent / 100)
	 */
	calculatePveme(consumption: number, params: CusdPenaltyParams): number {
		const lowerLimit =
			params.qdcContracted * (1 - params.pvemeTolerancePercent / 100);
		const deficit = Math.max(0, lowerLimit - consumption);
		return round2(deficit * params.basePricePerUnit);
	},

	/**
	 * Calculate Sobredemanda (Overdemand) penalty
	 *
	 * Tiered penalty for consumption above QDC:
	 * - Tier 1 (up to tier1MaxPercent of QDC): no charge
	 * - Tier 2 (tier1MaxPercent to tier2MaxPercent of QDC): tier2Multiplier × TUSD × volume
	 * - Tier 3 (above tier2MaxPercent of QDC): tier3Multiplier × TUSD × volume
	 */
	calculateSobredemanda(
		consumption: number,
		params: CusdPenaltyParams,
	): number {
		const qdc = params.qdcContracted;
		const tier1Limit = qdc * (params.overdemandTier1MaxPercent / 100);
		const tier2Limit = qdc * (params.overdemandTier2MaxPercent / 100);

		if (consumption <= tier1Limit) {
			return 0;
		}

		let penalty = 0;

		// Tier 2 volume: between tier1Limit and tier2Limit
		const tier2Volume = Math.min(consumption, tier2Limit) - tier1Limit;
		if (tier2Volume > 0) {
			penalty +=
				tier2Volume *
				params.tusdTariffPerUnit *
				params.overdemandTier2Multiplier;
		}

		// Tier 3 volume: above tier2Limit
		const tier3Volume = consumption - tier2Limit;
		if (tier3Volume > 0) {
			penalty +=
				tier3Volume *
				params.tusdTariffPerUnit *
				params.overdemandTier3Multiplier;
		}

		return round2(penalty);
	},

	/**
	 * Calculate all daily penalties (PVEMA + PVEME + Sobredemanda)
	 */
	calculateDailyPenalties(
		consumption: number,
		params: CusdPenaltyParams,
	): DailyPenaltyResult {
		const pvema = this.calculatePvema(consumption, params);
		const pveme = this.calculatePveme(consumption, params);
		const sobredemanda = this.calculateSobredemanda(consumption, params);

		return {
			pvema,
			pveme,
			sobredemanda,
			total: round2(pvema + pveme + sobredemanda),
		};
	},

	/**
	 * Calculate accumulated monthly penalties across all days
	 */
	calculateMonthlyPenalties(
		dailyConsumptions: number[],
		params: CusdPenaltyParams,
	): DailyPenaltyResult {
		const totals = { pvema: 0, pveme: 0, sobredemanda: 0, total: 0 };

		for (const consumption of dailyConsumptions) {
			const daily = this.calculateDailyPenalties(consumption, params);
			totals.pvema += daily.pvema;
			totals.pveme += daily.pveme;
			totals.sobredemanda += daily.sobredemanda;
		}

		totals.pvema = round2(totals.pvema);
		totals.pveme = round2(totals.pveme);
		totals.sobredemanda = round2(totals.sobredemanda);
		totals.total = round2(totals.pvema + totals.pveme + totals.sobredemanda);

		return totals;
	},

	/**
	 * Calculate monthly assertiveness and accuracy rates
	 *
	 * Assertiveness rate: % of days where QDR is within transport tolerance of QDP
	 * - Within tolerance means: QDP × (1 - lowerPct/100) ≤ QDR ≤ QDP × (1 + upperPct/100)
	 *
	 * Average accuracy rate: mean of (QDR / QDP × 100) across days with data
	 * - Days where QDP = 0 are excluded from accuracy calculation
	 */
	calculateMonthlyAccuracy(
		days: MonthlyDayEntry[],
		toleranceUpperPercent: number,
		toleranceLowerPercent: number,
	): MonthlyAccuracyResult {
		const validDays = days.filter((d) => d.qdp > 0 || d.qdr > 0);

		if (validDays.length === 0) {
			return {
				assertivenessRate: 0,
				averageAccuracyRate: 0,
				daysWithData: 0,
				daysWithinTolerance: 0,
			};
		}

		let daysWithinTolerance = 0;
		let accuracySum = 0;
		let accuracyDays = 0;

		for (const day of validDays) {
			const upperLimit = day.qdp * (1 + toleranceUpperPercent / 100);
			const lowerLimit = day.qdp * (1 - toleranceLowerPercent / 100);

			if (day.qdr >= lowerLimit && day.qdr <= upperLimit) {
				daysWithinTolerance++;
			}

			if (day.qdp > 0) {
				accuracySum += (day.qdr / day.qdp) * 100;
				accuracyDays++;
			}
		}

		return {
			assertivenessRate: round2(
				(daysWithinTolerance / validDays.length) * 100,
			),
			averageAccuracyRate:
				accuracyDays > 0 ? round2(accuracySum / accuracyDays) : 0,
			daysWithData: validDays.length,
			daysWithinTolerance,
		};
	},
};

/**
 * Normalize consumption rate to hourly rate (m³/h)
 */
function normalizeToHourlyRate(
	rate: number,
	unit: "m3_per_hour" | "m3_per_day",
): number {
	if (unit === "m3_per_day") {
		return rate / 24;
	}
	return rate;
}

/**
 * Round to 2 decimal places
 */
function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

// Export types for external use
export type {
	AtomizerInput,
	ContractTolerances,
	CusdPenaltyParams,
	DailyConsumptionData,
	DailyPenaltyResult,
	DeviationResult,
	EquipmentConstant,
	LineWithStatus,
	MonthlyAccuracyResult,
	MonthlyDayEntry,
	QdpEquipmentInput,
};
