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
 * Daily entry consumption data for deviation calculation
 */
interface DailyConsumptionData {
	qdsCalculated: number;
	qdsManual?: number | null;
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

// Export types for external use
export type {
	AtomizerInput,
	ContractTolerances,
	DailyConsumptionData,
	DeviationResult,
	EquipmentConstant,
	LineWithStatus,
};
