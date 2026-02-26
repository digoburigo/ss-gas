import { describe, expect, it } from "bun:test";

import { GasCalculationService } from "./gas.service";
import type { CusdPenaltyParams, QdpEquipmentInput } from "./gas.service";

describe("GasCalculationService", () => {
	describe("calculateQdp", () => {
		it("returns 0 when all equipment is OFF", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "off",
					consumptionRate: 100,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
				{
					status: "off",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
					plannedHours: 8,
				},
			];

			expect(GasCalculationService.calculateQdp(equipment)).toBe(0);
		});

		it("returns 0 when equipment list is empty", () => {
			expect(GasCalculationService.calculateQdp([])).toBe(0);
		});

		it("sums consumption for all ON equipment using m3_per_hour rates", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "on",
					consumptionRate: 100,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
				{
					status: "on",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
			];

			// 100 * 24 + 50 * 24 = 2400 + 1200 = 3600
			expect(GasCalculationService.calculateQdp(equipment)).toBe(3600);
		});

		it("excludes OFF equipment from the sum", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "on",
					consumptionRate: 100,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
				{
					status: "off",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
			];

			// Only first: 100 * 24 = 2400
			expect(GasCalculationService.calculateQdp(equipment)).toBe(2400);
		});

		it("normalizes m3_per_day rate to hourly before multiplying by hours", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "on",
					consumptionRate: 2400, // 2400 m³/day = 100 m³/h
					consumptionUnit: "m3_per_day",
					plannedHours: 12,
				},
			];

			// (2400 / 24) * 12 = 100 * 12 = 1200
			expect(GasCalculationService.calculateQdp(equipment)).toBe(1200);
		});

		it("handles mixed consumption units correctly", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "on",
					consumptionRate: 100,
					consumptionUnit: "m3_per_hour",
					plannedHours: 8,
				},
				{
					status: "on",
					consumptionRate: 480, // 480 m³/day = 20 m³/h
					consumptionUnit: "m3_per_day",
					plannedHours: 24,
				},
			];

			// 100 * 8 + (480/24) * 24 = 800 + 480 = 1280
			expect(GasCalculationService.calculateQdp(equipment)).toBe(1280);
		});

		it("handles atomizer with partial hours", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "on",
					consumptionRate: 150,
					consumptionUnit: "m3_per_hour",
					plannedHours: 6.5,
				},
			];

			// 150 * 6.5 = 975
			expect(GasCalculationService.calculateQdp(equipment)).toBe(975);
		});

		it("rounds result to 2 decimal places", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "on",
					consumptionRate: 33.33,
					consumptionUnit: "m3_per_hour",
					plannedHours: 7,
				},
			];

			// 33.33 * 7 = 233.31
			expect(GasCalculationService.calculateQdp(equipment)).toBe(233.31);
		});

		it("handles zero planned hours for ON equipment", () => {
			const equipment: QdpEquipmentInput[] = [
				{
					status: "on",
					consumptionRate: 100,
					consumptionUnit: "m3_per_hour",
					plannedHours: 0,
				},
			];

			expect(GasCalculationService.calculateQdp(equipment)).toBe(0);
		});

		it("simulates real scenario: atomizer + multiple lines", () => {
			const equipment: QdpEquipmentInput[] = [
				// Atomizer: ON for 8 hours at 200 m³/h
				{
					status: "on",
					consumptionRate: 200,
					consumptionUnit: "m3_per_hour",
					plannedHours: 8,
				},
				// Line 1: ON 24h at 50 m³/h
				{
					status: "on",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
				// Line 2: OFF
				{
					status: "off",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
				// Line 3: ON 24h at 75 m³/h
				{
					status: "on",
					consumptionRate: 75,
					consumptionUnit: "m3_per_hour",
					plannedHours: 24,
				},
			];

			// 200*8 + 50*24 + 0 + 75*24 = 1600 + 1200 + 1800 = 4600
			expect(GasCalculationService.calculateQdp(equipment)).toBe(4600);
		});
	});

	describe("calculateQdcAtomizer", () => {
		it("calculates single atomizer consumption", () => {
			const result = GasCalculationService.calculateQdcAtomizer({
				scheduled: true,
				hours: 10,
				consumptionRate: 100,
				consumptionUnit: "m3_per_hour",
			});

			expect(result).toBe(1000);
		});

		it("returns 0 when atomizer is not scheduled", () => {
			const result = GasCalculationService.calculateQdcAtomizer({
				scheduled: false,
				hours: 10,
				consumptionRate: 100,
				consumptionUnit: "m3_per_hour",
			});

			expect(result).toBe(0);
		});

		it("sums primary and secondary atomizers", () => {
			const result = GasCalculationService.calculateQdcAtomizer(
				{
					scheduled: true,
					hours: 8,
					consumptionRate: 100,
					consumptionUnit: "m3_per_hour",
				},
				{
					scheduled: true,
					hours: 6,
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
				},
			);

			// 100*8 + 50*6 = 800 + 300 = 1100
			expect(result).toBe(1100);
		});
	});

	describe("calculateQdcLines", () => {
		it("sums only ON lines", () => {
			const result = GasCalculationService.calculateQdcLines([
				{
					equipmentId: "1",
					status: "on",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
				},
				{
					equipmentId: "2",
					status: "off",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
				},
				{
					equipmentId: "3",
					status: "on",
					consumptionRate: 75,
					consumptionUnit: "m3_per_hour",
				},
			]);

			// 50*24 + 75*24 = 1200 + 1800 = 3000
			expect(result).toBe(3000);
		});

		it("returns 0 when all lines are OFF", () => {
			const result = GasCalculationService.calculateQdcLines([
				{
					equipmentId: "1",
					status: "off",
					consumptionRate: 50,
					consumptionUnit: "m3_per_hour",
				},
			]);

			expect(result).toBe(0);
		});
	});

	describe("calculateQds", () => {
		it("sums atomizer and lines consumption", () => {
			const result = GasCalculationService.calculateQds(800, 1200);
			expect(result).toBe(2000);
		});
	});

	describe("calculateDeviations", () => {
		const contract = {
			qdcContracted: 10000,
			transportToleranceUpperPercent: 10,
			transportToleranceLowerPercent: 20,
			moleculeTolerancePercent: 15,
		};

		it("returns within status when consumption is within tolerance", () => {
			const result = GasCalculationService.calculateDeviations(
				{ qdsCalculated: 10000 },
				contract,
			);

			expect(result.transportStatus).toBe("within");
			expect(result.moleculeStatus).toBe("within");
		});

		it("returns exceeded_upper when above transport upper limit", () => {
			// Upper limit = 10000 + 10000*10/100 = 11000
			const result = GasCalculationService.calculateDeviations(
				{ qdsCalculated: 11500 },
				contract,
			);

			expect(result.transportStatus).toBe("exceeded_upper");
		});

		it("returns exceeded_lower when below transport lower limit", () => {
			// Lower limit = 10000 - 10000*20/100 = 8000
			const result = GasCalculationService.calculateDeviations(
				{ qdsCalculated: 7500 },
				contract,
			);

			expect(result.transportStatus).toBe("exceeded_lower");
		});

		it("uses qdsManual over qdsCalculated when provided", () => {
			const result = GasCalculationService.calculateDeviations(
				{ qdsCalculated: 10000, qdsManual: 11500 },
				contract,
			);

			expect(result.transportStatus).toBe("exceeded_upper");
		});
	});

	// ============================================================
	// CUSD Penalty Calculations (US-007)
	// ============================================================

	// Standard contract params used across test scenarios
	// QDC = 10,000 m³/day, PVEMA tolerance +10%, PVEME tolerance -20%
	// Sobredemanda tiers: up to 110% free, 110-115% @1x TUSD, >115% @1.5x TUSD
	// TUSD = R$ 0.50/m³, base gas price = R$ 2.00/m³
	const penaltyParams: CusdPenaltyParams = {
		qdcContracted: 10000,
		pvemaTolerancePercent: 10,
		pvemeTolerancePercent: 20,
		overdemandTier1MaxPercent: 110,
		overdemandTier2MaxPercent: 115,
		overdemandTier2Multiplier: 1.0,
		overdemandTier3Multiplier: 1.5,
		tusdTariffPerUnit: 0.5,
		basePricePerUnit: 2.0,
	};

	describe("calculatePvema", () => {
		it("returns 0 when consumption is within upper tolerance", () => {
			// Upper limit = 10000 × 1.10 = 11000
			// Consumption = 10500, within limit → no penalty
			const result = GasCalculationService.calculatePvema(10500, penaltyParams);
			expect(result).toBe(0);
		});

		it("returns 0 when consumption equals upper limit exactly", () => {
			// Upper limit = 11000, consumption = 11000 → no penalty
			const result = GasCalculationService.calculatePvema(11000, penaltyParams);
			expect(result).toBe(0);
		});

		it("calculates penalty for consumption above upper tolerance", () => {
			// Upper limit = 11000, consumption = 11500
			// Excess = 11500 - 11000 = 500
			// Penalty = 500 × R$ 2.00 = R$ 1000.00
			const result = GasCalculationService.calculatePvema(11500, penaltyParams);
			expect(result).toBe(1000);
		});

		it("returns 0 when consumption is below QDC", () => {
			const result = GasCalculationService.calculatePvema(8000, penaltyParams);
			expect(result).toBe(0);
		});

		it("returns 0 for zero consumption", () => {
			const result = GasCalculationService.calculatePvema(0, penaltyParams);
			expect(result).toBe(0);
		});

		// Scenario 1 (Excel match): large excess
		it("scenario 1: 12,000 m³ consumption → R$ 2000 penalty", () => {
			// Upper limit = 11000, excess = 12000 - 11000 = 1000
			// Penalty = 1000 × R$ 2.00 = R$ 2000.00
			const result = GasCalculationService.calculatePvema(12000, penaltyParams);
			expect(result).toBe(2000);
		});
	});

	describe("calculatePveme", () => {
		it("returns 0 when consumption is within lower tolerance", () => {
			// Lower limit = 10000 × 0.80 = 8000
			// Consumption = 9000, within limit → no penalty
			const result = GasCalculationService.calculatePveme(9000, penaltyParams);
			expect(result).toBe(0);
		});

		it("returns 0 when consumption equals lower limit exactly", () => {
			// Lower limit = 8000, consumption = 8000 → no penalty
			const result = GasCalculationService.calculatePveme(8000, penaltyParams);
			expect(result).toBe(0);
		});

		it("calculates penalty for consumption below lower tolerance", () => {
			// Lower limit = 8000, consumption = 7000
			// Deficit = 8000 - 7000 = 1000
			// Penalty = 1000 × R$ 2.00 = R$ 2000.00
			const result = GasCalculationService.calculatePveme(7000, penaltyParams);
			expect(result).toBe(2000);
		});

		it("returns 0 when consumption is above QDC", () => {
			const result = GasCalculationService.calculatePveme(11000, penaltyParams);
			expect(result).toBe(0);
		});

		// Scenario 2 (Excel match): zero consumption day
		it("scenario 2: zero consumption → R$ 16000 penalty", () => {
			// Lower limit = 8000, deficit = 8000 - 0 = 8000
			// Penalty = 8000 × R$ 2.00 = R$ 16000.00
			const result = GasCalculationService.calculatePveme(0, penaltyParams);
			expect(result).toBe(16000);
		});

		// Scenario 3 (Excel match): slightly below tolerance
		it("scenario 3: 7500 m³ → R$ 1000 penalty", () => {
			// Lower limit = 8000, deficit = 8000 - 7500 = 500
			// Penalty = 500 × R$ 2.00 = R$ 1000.00
			const result = GasCalculationService.calculatePveme(7500, penaltyParams);
			expect(result).toBe(1000);
		});
	});

	describe("calculateSobredemanda", () => {
		it("returns 0 when consumption is within tier 1 (up to 110% QDC)", () => {
			// Tier 1 limit = 10000 × 110% = 11000
			// Consumption = 10800 → within tier 1 → no charge
			const result = GasCalculationService.calculateSobredemanda(
				10800,
				penaltyParams,
			);
			expect(result).toBe(0);
		});

		it("returns 0 when consumption equals tier 1 limit exactly", () => {
			const result = GasCalculationService.calculateSobredemanda(
				11000,
				penaltyParams,
			);
			expect(result).toBe(0);
		});

		it("returns 0 when consumption is below QDC", () => {
			const result = GasCalculationService.calculateSobredemanda(
				8000,
				penaltyParams,
			);
			expect(result).toBe(0);
		});

		it("charges tier 2 for consumption between 110% and 115%", () => {
			// Tier 1 limit = 11000, Tier 2 limit = 11500
			// Consumption = 11300
			// Tier 2 volume = 11300 - 11000 = 300
			// Penalty = 300 × R$ 0.50 × 1.0 = R$ 150.00
			const result = GasCalculationService.calculateSobredemanda(
				11300,
				penaltyParams,
			);
			expect(result).toBe(150);
		});

		it("charges tier 2 + tier 3 for consumption above 115%", () => {
			// Tier 1 limit = 11000, Tier 2 limit = 11500
			// Consumption = 12000
			// Tier 2 volume = 11500 - 11000 = 500 → 500 × 0.50 × 1.0 = R$ 250
			// Tier 3 volume = 12000 - 11500 = 500 → 500 × 0.50 × 1.5 = R$ 375
			// Total = R$ 625
			const result = GasCalculationService.calculateSobredemanda(
				12000,
				penaltyParams,
			);
			expect(result).toBe(625);
		});

		// Scenario 1 (Excel match): consumption at tier 2 boundary
		it("scenario 1: 11500 m³ → R$ 250 (full tier 2)", () => {
			// Tier 2 volume = 11500 - 11000 = 500
			// Penalty = 500 × 0.50 × 1.0 = R$ 250
			const result = GasCalculationService.calculateSobredemanda(
				11500,
				penaltyParams,
			);
			expect(result).toBe(250);
		});

		// Scenario 2 (Excel match): large overdemand
		it("scenario 2: 13000 m³ → R$ 1375 (tier 2 + tier 3)", () => {
			// Tier 2 volume = 11500 - 11000 = 500 → 500 × 0.50 × 1.0 = R$ 250
			// Tier 3 volume = 13000 - 11500 = 1500 → 1500 × 0.50 × 1.5 = R$ 1125
			// Total = R$ 1375
			const result = GasCalculationService.calculateSobredemanda(
				13000,
				penaltyParams,
			);
			expect(result).toBe(1375);
		});

		// Scenario 3 (Excel match): zero consumption
		it("scenario 3: 0 m³ → R$ 0 (no overdemand)", () => {
			const result = GasCalculationService.calculateSobredemanda(
				0,
				penaltyParams,
			);
			expect(result).toBe(0);
		});
	});

	describe("calculateDailyPenalties", () => {
		// Excel scenario A: normal day, consumption within tolerance (10,000 m³)
		it("scenario A: consumption at QDC → no penalties", () => {
			const result = GasCalculationService.calculateDailyPenalties(
				10000,
				penaltyParams,
			);
			expect(result.pvema).toBe(0);
			expect(result.pveme).toBe(0);
			expect(result.sobredemanda).toBe(0);
			expect(result.total).toBe(0);
		});

		// Excel scenario B: high consumption (12,000 m³) → PVEMA + Sobredemanda
		it("scenario B: 12000 m³ → PVEMA R$ 2000 + Sobredemanda R$ 625", () => {
			const result = GasCalculationService.calculateDailyPenalties(
				12000,
				penaltyParams,
			);
			// PVEMA: excess above 11000 = 1000 → 1000 × 2.00 = R$ 2000
			expect(result.pvema).toBe(2000);
			expect(result.pveme).toBe(0);
			// Sobredemanda: T2=500×0.50×1.0=250, T3=500×0.50×1.5=375 → 625
			expect(result.sobredemanda).toBe(625);
			expect(result.total).toBe(2625);
		});

		// Excel scenario C: low consumption (5,000 m³) → PVEME only
		it("scenario C: 5000 m³ → PVEME R$ 6000, no overdemand", () => {
			const result = GasCalculationService.calculateDailyPenalties(
				5000,
				penaltyParams,
			);
			expect(result.pvema).toBe(0);
			// PVEME: deficit below 8000 = 3000 → 3000 × 2.00 = R$ 6000
			expect(result.pveme).toBe(6000);
			expect(result.sobredemanda).toBe(0);
			expect(result.total).toBe(6000);
		});

		// Edge case: zero consumption
		it("zero consumption → PVEME penalty only", () => {
			const result = GasCalculationService.calculateDailyPenalties(
				0,
				penaltyParams,
			);
			expect(result.pvema).toBe(0);
			// Deficit = 8000, penalty = 8000 × 2.00 = R$ 16000
			expect(result.pveme).toBe(16000);
			expect(result.sobredemanda).toBe(0);
			expect(result.total).toBe(16000);
		});
	});

	describe("calculateMonthlyPenalties", () => {
		it("accumulates penalties across multiple days", () => {
			// Day 1: 10000 (no penalty)
			// Day 2: 12000 (PVEMA: 2000, Sobredemanda: 625)
			// Day 3: 5000 (PVEME: 6000)
			const dailyConsumptions = [10000, 12000, 5000];

			const result = GasCalculationService.calculateMonthlyPenalties(
				dailyConsumptions,
				penaltyParams,
			);

			expect(result.pvema).toBe(2000);
			expect(result.pveme).toBe(6000);
			expect(result.sobredemanda).toBe(625);
			expect(result.total).toBe(8625);
		});

		it("returns zeros for empty consumption array (partial month - no data)", () => {
			const result = GasCalculationService.calculateMonthlyPenalties(
				[],
				penaltyParams,
			);

			expect(result.pvema).toBe(0);
			expect(result.pveme).toBe(0);
			expect(result.sobredemanda).toBe(0);
			expect(result.total).toBe(0);
		});

		it("handles partial month with mixed days", () => {
			// Only 5 days of data (partial month)
			const dailyConsumptions = [
				10000, // normal
				11500, // at tier 2 boundary: PVEMA=500×2=1000, Sob=500×0.5×1=250
				8000, // at lower limit: no PVEME
				7000, // below lower: PVEME=1000×2=2000
				13000, // high: PVEMA=2000×2=4000, Sob=T2(250)+T3(1500×0.5×1.5=1125)=1375
			];

			const result = GasCalculationService.calculateMonthlyPenalties(
				dailyConsumptions,
				penaltyParams,
			);

			expect(result.pvema).toBe(5000); // 0 + 1000 + 0 + 0 + 4000
			expect(result.pveme).toBe(2000); // 0 + 0 + 0 + 2000 + 0
			expect(result.sobredemanda).toBe(1625); // 0 + 250 + 0 + 0 + 1375
			expect(result.total).toBe(8625);
		});
	});

	describe("calculateMonthlyAccuracy", () => {
		it("calculates assertiveness and accuracy for normal month", () => {
			// 5 days, tolerance +10% / -20%
			// QDP=10000 → upper=11000, lower=8000
			const days = [
				{ qdp: 10000, qdr: 10000 }, // within, accuracy=100%
				{ qdp: 10000, qdr: 10500 }, // within, accuracy=105%
				{ qdp: 10000, qdr: 8500 }, // within, accuracy=85%
				{ qdp: 10000, qdr: 12000 }, // exceeded upper, accuracy=120%
				{ qdp: 10000, qdr: 7000 }, // exceeded lower, accuracy=70%
			];

			const result = GasCalculationService.calculateMonthlyAccuracy(
				days,
				10,
				20,
			);

			// 3 of 5 days within tolerance
			expect(result.assertivenessRate).toBe(60);
			// Average accuracy: (100 + 105 + 85 + 120 + 70) / 5 = 480 / 5 = 96%
			expect(result.averageAccuracyRate).toBe(96);
			expect(result.daysWithData).toBe(5);
			expect(result.daysWithinTolerance).toBe(3);
		});

		it("returns zeros when no data (empty array)", () => {
			const result = GasCalculationService.calculateMonthlyAccuracy(
				[],
				10,
				20,
			);

			expect(result.assertivenessRate).toBe(0);
			expect(result.averageAccuracyRate).toBe(0);
			expect(result.daysWithData).toBe(0);
			expect(result.daysWithinTolerance).toBe(0);
		});

		it("handles zero QDP days (missing QDP)", () => {
			// Days where QDP is 0 should be included in assertiveness but excluded from accuracy avg
			const days = [
				{ qdp: 0, qdr: 500 }, // no QDP, has QDR → counted for assertiveness, excluded from accuracy
				{ qdp: 10000, qdr: 10000 }, // normal
				{ qdp: 10000, qdr: 9000 }, // within
			];

			const result = GasCalculationService.calculateMonthlyAccuracy(
				days,
				10,
				20,
			);

			// Day 1: QDP=0, upper=0, lower=0, QDR=500 > 0 → exceeded
			// Day 2: within
			// Day 3: within
			// Assertiveness: 2 / 3 = 66.67%
			expect(result.assertivenessRate).toBe(66.67);
			// Accuracy: only days with QDP>0 → (100 + 90) / 2 = 95%
			expect(result.averageAccuracyRate).toBe(95);
			expect(result.daysWithData).toBe(3);
			expect(result.daysWithinTolerance).toBe(2);
		});

		it("handles all zero consumption days", () => {
			// Both QDP and QDR are 0 → these are "empty" days, excluded
			const days = [
				{ qdp: 0, qdr: 0 },
				{ qdp: 0, qdr: 0 },
			];

			const result = GasCalculationService.calculateMonthlyAccuracy(
				days,
				10,
				20,
			);

			expect(result.assertivenessRate).toBe(0);
			expect(result.averageAccuracyRate).toBe(0);
			expect(result.daysWithData).toBe(0);
		});

		it("handles partial month (fewer days than full month)", () => {
			// Only 3 days of data out of a 30-day month
			const days = [
				{ qdp: 5000, qdr: 5200 }, // within 10%/20%, accuracy=104%
				{ qdp: 5000, qdr: 5600 }, // 5600 > 5500 (upper 110%) → exceeded, accuracy=112%
				{ qdp: 5000, qdr: 4500 }, // 4500 > 4000 (lower 80%) → within, accuracy=90%
			];

			const result = GasCalculationService.calculateMonthlyAccuracy(
				days,
				10,
				20,
			);

			// 2 of 3 within tolerance
			expect(result.assertivenessRate).toBe(66.67);
			// Average accuracy: (104 + 112 + 90) / 3 = 306 / 3 = 102%
			expect(result.averageAccuracyRate).toBe(102);
			expect(result.daysWithData).toBe(3);
			expect(result.daysWithinTolerance).toBe(2);
		});

		it("100% assertiveness when all days are within tolerance", () => {
			const days = [
				{ qdp: 10000, qdr: 10000 },
				{ qdp: 10000, qdr: 10500 },
				{ qdp: 10000, qdr: 9000 },
			];

			const result = GasCalculationService.calculateMonthlyAccuracy(
				days,
				10,
				20,
			);

			expect(result.assertivenessRate).toBe(100);
			expect(result.daysWithinTolerance).toBe(3);
		});

		it("0% assertiveness when no days are within tolerance", () => {
			const days = [
				{ qdp: 10000, qdr: 12000 }, // 120% > 110% → exceeded
				{ qdp: 10000, qdr: 7000 }, // 70% < 80% → exceeded
			];

			const result = GasCalculationService.calculateMonthlyAccuracy(
				days,
				10,
				20,
			);

			expect(result.assertivenessRate).toBe(0);
			expect(result.daysWithinTolerance).toBe(0);
			// Average accuracy: (120 + 70) / 2 = 95%
			expect(result.averageAccuracyRate).toBe(95);
		});
	});
});
