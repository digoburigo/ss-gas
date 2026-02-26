import { describe, expect, it } from "bun:test";

import { GasCalculationService } from "./gas.service";
import type { QdpEquipmentInput } from "./gas.service";

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
});
