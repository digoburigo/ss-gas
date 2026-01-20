import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { X } from "lucide-react";
import * as z from "zod";

import type { GasUnit } from "@acme/zen-v3/zenstack/models";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

import {
  adjustmentFrequencyOptions,
  adjustmentIndexOptions,
  currencyOptions,
  volumeUnitOptions,
} from "../data/data";

interface ContractFormData {
  // Basic Data
  name: string;
  contractNumber: string;
  supplier: string;
  supplierCnpj: string;

  // Volumes and Flexibilities
  qdcContracted: number;
  volumeUnit: string;
  transportToleranceUpperPercent: number;
  transportToleranceLowerPercent: number;
  moleculeTolerancePercent: number;
  takeOrPayPercent: number | null;
  takeOrPayAccumulationMonths: number | null;
  takeOrPayExpirationMonths: number | null;
  makeUpGasEnabled: boolean;
  makeUpGasExpirationMonths: number | null;
  makeUpGasMaxPercent: number | null;
  flexibilityUpPercent: number | null;
  flexibilityDownPercent: number | null;
  seasonalFlexibility: boolean;

  // Prices and Adjustments
  basePricePerUnit: number | null;
  priceCurrency: string;
  adjustmentIndex: string;
  adjustmentFrequency: string;
  adjustmentBaseDate: string;
  nextAdjustmentDate: string;
  transportCostPerUnit: number | null;
  taxesIncluded: boolean;

  // Penalties
  penaltyForUnderConsumption: number | null;
  penaltyForOverConsumption: number | null;
  penaltyCalculationMethod: string;
  latePaymentPenaltyPercent: number | null;
  latePaymentInterestPercent: number | null;

  // Important Events/Dates
  effectiveFrom: string;
  effectiveTo: string;
  renewalDate: string;
  renewalNoticeDays: number | null;
  dailySchedulingDeadline: string;
  monthlyDeclarationDeadline: number | null;

  // General
  active: boolean;
  notes: string;

  // Linked units
  unitIds: string[];
}

interface ContractFormProps {
  defaultValues?: Partial<ContractFormData>;
  onSubmit: (data: ContractFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ContractForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ContractFormProps) {
  const client = useClientQueries(schema);
  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const form = useForm({
    defaultValues: {
      // Basic Data
      name: defaultValues?.name ?? "",
      contractNumber: defaultValues?.contractNumber ?? "",
      supplier: defaultValues?.supplier ?? "",
      supplierCnpj: defaultValues?.supplierCnpj ?? "",

      // Volumes and Flexibilities
      qdcContracted: defaultValues?.qdcContracted ?? 0,
      volumeUnit: defaultValues?.volumeUnit ?? "m3",
      transportToleranceUpperPercent:
        defaultValues?.transportToleranceUpperPercent ?? 10,
      transportToleranceLowerPercent:
        defaultValues?.transportToleranceLowerPercent ?? 20,
      moleculeTolerancePercent: defaultValues?.moleculeTolerancePercent ?? 5,
      takeOrPayPercent: defaultValues?.takeOrPayPercent ?? null,
      takeOrPayAccumulationMonths:
        defaultValues?.takeOrPayAccumulationMonths ?? null,
      takeOrPayExpirationMonths:
        defaultValues?.takeOrPayExpirationMonths ?? null,
      makeUpGasEnabled: defaultValues?.makeUpGasEnabled ?? false,
      makeUpGasExpirationMonths:
        defaultValues?.makeUpGasExpirationMonths ?? null,
      makeUpGasMaxPercent: defaultValues?.makeUpGasMaxPercent ?? null,
      flexibilityUpPercent: defaultValues?.flexibilityUpPercent ?? null,
      flexibilityDownPercent: defaultValues?.flexibilityDownPercent ?? null,
      seasonalFlexibility: defaultValues?.seasonalFlexibility ?? false,

      // Prices and Adjustments
      basePricePerUnit: defaultValues?.basePricePerUnit ?? null,
      priceCurrency: defaultValues?.priceCurrency ?? "BRL",
      adjustmentIndex: defaultValues?.adjustmentIndex ?? "",
      adjustmentFrequency: defaultValues?.adjustmentFrequency ?? "",
      adjustmentBaseDate: defaultValues?.adjustmentBaseDate ?? "",
      nextAdjustmentDate: defaultValues?.nextAdjustmentDate ?? "",
      transportCostPerUnit: defaultValues?.transportCostPerUnit ?? null,
      taxesIncluded: defaultValues?.taxesIncluded ?? false,

      // Penalties
      penaltyForUnderConsumption:
        defaultValues?.penaltyForUnderConsumption ?? null,
      penaltyForOverConsumption:
        defaultValues?.penaltyForOverConsumption ?? null,
      penaltyCalculationMethod: defaultValues?.penaltyCalculationMethod ?? "",
      latePaymentPenaltyPercent:
        defaultValues?.latePaymentPenaltyPercent ?? null,
      latePaymentInterestPercent:
        defaultValues?.latePaymentInterestPercent ?? null,

      // Important Events/Dates
      effectiveFrom: defaultValues?.effectiveFrom ?? "",
      effectiveTo: defaultValues?.effectiveTo ?? "",
      renewalDate: defaultValues?.renewalDate ?? "",
      renewalNoticeDays: defaultValues?.renewalNoticeDays ?? null,
      dailySchedulingDeadline: defaultValues?.dailySchedulingDeadline ?? "",
      monthlyDeclarationDeadline:
        defaultValues?.monthlyDeclarationDeadline ?? null,

      // General
      active: defaultValues?.active ?? true,
      notes: defaultValues?.notes ?? "",

      // Linked units
      unitIds: defaultValues?.unitIds ?? [],
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Nome do contrato é obrigatório"),
        contractNumber: z.string().optional(),
        supplier: z.string().optional(),
        supplierCnpj: z.string().optional(),
        qdcContracted: z.number().min(0, "QDC deve ser positivo"),
        volumeUnit: z.string(),
        transportToleranceUpperPercent: z.number().min(0),
        transportToleranceLowerPercent: z.number().min(0),
        moleculeTolerancePercent: z.number().min(0),
        takeOrPayPercent: z.number().nullable(),
        takeOrPayAccumulationMonths: z.number().nullable(),
        takeOrPayExpirationMonths: z.number().nullable(),
        makeUpGasEnabled: z.boolean(),
        makeUpGasExpirationMonths: z.number().nullable(),
        makeUpGasMaxPercent: z.number().nullable(),
        flexibilityUpPercent: z.number().nullable(),
        flexibilityDownPercent: z.number().nullable(),
        seasonalFlexibility: z.boolean(),
        basePricePerUnit: z.number().nullable(),
        priceCurrency: z.string(),
        adjustmentIndex: z.string().optional(),
        adjustmentFrequency: z.string().optional(),
        adjustmentBaseDate: z.string().optional(),
        nextAdjustmentDate: z.string().optional(),
        transportCostPerUnit: z.number().nullable(),
        taxesIncluded: z.boolean(),
        penaltyForUnderConsumption: z.number().nullable(),
        penaltyForOverConsumption: z.number().nullable(),
        penaltyCalculationMethod: z.string().optional(),
        latePaymentPenaltyPercent: z.number().nullable(),
        latePaymentInterestPercent: z.number().nullable(),
        effectiveFrom: z.string().min(1, "Data de início é obrigatória"),
        effectiveTo: z.string().optional(),
        renewalDate: z.string().optional(),
        renewalNoticeDays: z.number().nullable(),
        dailySchedulingDeadline: z.string().optional(),
        monthlyDeclarationDeadline: z.number().nullable(),
        active: z.boolean(),
        notes: z.string().optional(),
        unitIds: z.array(z.string()),
      }),
    },
  });

  const handleToggleUnit = (unitId: string) => {
    const currentIds = form.getFieldValue("unitIds");
    if (currentIds.includes(unitId)) {
      form.setFieldValue(
        "unitIds",
        currentIds.filter((id) => id !== unitId),
      );
    } else {
      form.setFieldValue("unitIds", [...currentIds, unitId]);
    }
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* === Section 1: Basic Data === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados Básicos</h3>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nome do Contrato *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Ex: Contrato Petrobras 2024"
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="contractNumber">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Número do Contrato</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Ex: CT-2024-001"
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="supplier">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Fornecedor</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Nome do fornecedor/distribuidora"
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="supplierCnpj">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>CNPJ do Fornecedor</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="00.000.000/0000-00"
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* === Section 2: Volumes and Flexibilities === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Volumes e Flexibilidades</h3>
        <Separator />

        {/* Main Volume */}
        <div className="grid gap-4 md:grid-cols-3">
          <form.Field name="qdcContracted">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  QDC - Quantidade Diária Contratada *
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(Number(e.target.value) || 0)
                  }
                  type="number"
                  step="0.01"
                  value={field.state.value}
                  placeholder="0.00"
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="volumeUnit">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Unidade de Volume</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  {volumeUnitOptions.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </form.Field>
        </div>

        {/* Tolerances */}
        <div className="grid gap-4 md:grid-cols-3">
          <form.Field name="transportToleranceUpperPercent">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Tolerância Transporte Superior (%)
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(Number(e.target.value) || 0)
                  }
                  type="number"
                  step="0.1"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="transportToleranceLowerPercent">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Tolerância Transporte Inferior (%)
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(Number(e.target.value) || 0)
                  }
                  type="number"
                  step="0.1"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="moleculeTolerancePercent">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Tolerância Molécula (%)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(Number(e.target.value) || 0)
                  }
                  type="number"
                  step="0.1"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>

        {/* Take-or-Pay */}
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="font-medium">Cláusula Take-or-Pay</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <form.Field name="takeOrPayPercent">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Percentual Take-or-Pay (%)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    type="number"
                    step="0.1"
                    value={field.state.value ?? ""}
                    placeholder="Ex: 80"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="takeOrPayAccumulationMonths">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Meses de Acumulação</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    type="number"
                    value={field.state.value ?? ""}
                    placeholder="Ex: 12"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="takeOrPayExpirationMonths">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Meses para Expiração do Crédito
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    type="number"
                    value={field.state.value ?? ""}
                    placeholder="Ex: 36"
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* Make-up Gas */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <form.Field name="makeUpGasEnabled">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                  />
                  <Label htmlFor={field.name} className="font-medium">
                    Habilitar Make-up Gas
                  </Label>
                </div>
              )}
            </form.Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="makeUpGasExpirationMonths">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Meses para Expiração</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    type="number"
                    value={field.state.value ?? ""}
                    placeholder="Ex: 24"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="makeUpGasMaxPercent">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>% Máximo de Recuperação</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    type="number"
                    step="0.1"
                    value={field.state.value ?? ""}
                    placeholder="Ex: 20"
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* Flexibility */}
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="font-medium">Flexibilidades</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="flexibilityUpPercent">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Flexibilidade para Cima (%)
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    type="number"
                    step="0.1"
                    value={field.state.value ?? ""}
                    placeholder="Ex: 10"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="flexibilityDownPercent">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Flexibilidade para Baixo (%)
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    type="number"
                    step="0.1"
                    value={field.state.value ?? ""}
                    placeholder="Ex: 20"
                  />
                </div>
              )}
            </form.Field>
          </div>
          <form.Field name="seasonalFlexibility">
            {(field) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(!!checked)}
                />
                <Label htmlFor={field.name}>
                  Flexibilidade sazonal habilitada
                </Label>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* === Section 3: Prices and Adjustments === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preços e Reajustes</h3>
        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <form.Field name="basePricePerUnit">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Preço Base por Unidade</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  step="0.01"
                  value={field.state.value ?? ""}
                  placeholder="0.00"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="priceCurrency">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Moeda</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  {currencyOptions.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </form.Field>

          <form.Field name="transportCostPerUnit">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Custo de Transporte por Unidade
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  step="0.01"
                  value={field.state.value ?? ""}
                  placeholder="0.00"
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <form.Field name="adjustmentIndex">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Índice de Reajuste</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  <NativeSelectOption value="">Selecione</NativeSelectOption>
                  {adjustmentIndexOptions.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </form.Field>

          <form.Field name="adjustmentFrequency">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Frequência de Reajuste</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  <NativeSelectOption value="">Selecione</NativeSelectOption>
                  {adjustmentFrequencyOptions.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </form.Field>

          <form.Field name="adjustmentBaseDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Data Base do Reajuste</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="nextAdjustmentDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Próximo Reajuste</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="taxesIncluded">
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(!!checked)}
              />
              <Label htmlFor={field.name}>Impostos inclusos no preço</Label>
            </div>
          )}
        </form.Field>
      </div>

      {/* === Section 4: Penalties === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Penalidades</h3>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="penaltyForUnderConsumption">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Multa por Subconsumo (R$/unidade)
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  step="0.01"
                  value={field.state.value ?? ""}
                  placeholder="0.00"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="penaltyForOverConsumption">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Multa por Sobreconsumo (R$/unidade)
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  step="0.01"
                  value={field.state.value ?? ""}
                  placeholder="0.00"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="latePaymentPenaltyPercent">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Multa por Atraso (%)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  step="0.1"
                  value={field.state.value ?? ""}
                  placeholder="Ex: 2"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="latePaymentInterestPercent">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Juros de Mora Mensal (%)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  step="0.1"
                  value={field.state.value ?? ""}
                  placeholder="Ex: 1"
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="penaltyCalculationMethod">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Método de Cálculo da Penalidade
              </Label>
              <Textarea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
                placeholder="Descreva o método de cálculo das penalidades conforme contrato..."
                rows={3}
              />
            </div>
          )}
        </form.Field>
      </div>

      {/* === Section 5: Important Events/Dates === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Datas e Eventos Importantes</h3>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="effectiveFrom">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Data de Início do Contrato *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="effectiveTo">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Data de Término do Contrato</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="renewalDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Data Limite para Renovação</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="renewalNoticeDays">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Dias de Antecedência para Notificação de Renovação
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  value={field.state.value ?? ""}
                  placeholder="Ex: 30"
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="dailySchedulingDeadline">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Horário Limite para Agendamento Diário
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="time"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="monthlyDeclarationDeadline">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Dia do Mês para Declaração Mensal
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  type="number"
                  min="1"
                  max="31"
                  value={field.state.value ?? ""}
                  placeholder="Ex: 5"
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* === Section 6: Link Units === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Unidades Consumidoras Vinculadas
        </h3>
        <Separator />
        <form.Field name="unitIds">
          {(field) => (
            <div className="space-y-2">
              <Label>Selecione as unidades vinculadas a este contrato</Label>
              {(units as GasUnit[]).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma unidade consumidora cadastrada.
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {(units as GasUnit[]).map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center gap-2 rounded border p-2"
                    >
                      <Checkbox
                        id={`unit-${unit.id}`}
                        checked={field.state.value.includes(unit.id)}
                        onCheckedChange={() => handleToggleUnit(unit.id)}
                      />
                      <Label
                        htmlFor={`unit-${unit.id}`}
                        className="flex cursor-pointer flex-col"
                      >
                        <span className="font-medium">{unit.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {unit.code}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {field.state.value.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.state.value.map((unitId) => {
                    const unit = (units as GasUnit[]).find(
                      (u) => u.id === unitId,
                    );
                    if (!unit) return null;
                    return (
                      <span
                        key={unitId}
                        className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm"
                      >
                        {unit.name}
                        <button
                          type="button"
                          onClick={() => handleToggleUnit(unitId)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form.Field>
      </div>

      {/* === Section 7: Status and Notes === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status e Observações</h3>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="active">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Status do Contrato</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(e.target.value === "true")
                  }
                  value={field.state.value ? "true" : "false"}
                >
                  <NativeSelectOption value="true">Ativo</NativeSelectOption>
                  <NativeSelectOption value="false">Inativo</NativeSelectOption>
                </NativeSelect>
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="notes">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Observações Gerais</Label>
              <Textarea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
                placeholder="Observações adicionais sobre o contrato..."
                rows={4}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe>
        {(state) => (
          <div className="flex justify-end gap-2 pt-4">
            <Button
              disabled={!state.canSubmit || state.isSubmitting || isSubmitting}
              type="submit"
              size="lg"
            >
              {state.isSubmitting || isSubmitting
                ? "Salvando..."
                : "Salvar Contrato"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
