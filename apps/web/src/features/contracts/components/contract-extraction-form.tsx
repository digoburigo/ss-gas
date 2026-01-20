import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { AlertTriangle, Check, X } from "lucide-react";
import * as z from "zod";

import type { GasUnit } from "@acme/zen-v3/zenstack/models";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";
import { schema } from "@acme/zen-v3/zenstack/schema";

import {
  adjustmentFrequencyOptions,
  adjustmentIndexOptions,
  currencyOptions,
  volumeUnitOptions,
} from "../data/data";

type ExtractedField = {
  value: string | number | boolean | null;
  confidence: number;
  source?: string;
};

type ExtractedContractData = {
  [key: string]: ExtractedField;
};

interface ContractExtractionFormProps {
  extractedData: ExtractedContractData;
  onSubmit: (data: ContractFormData) => Promise<void>;
  isSubmitting?: boolean;
}

interface ContractFormData {
  name: string;
  contractNumber: string;
  supplier: string;
  supplierCnpj: string;
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
  basePricePerUnit: number | null;
  priceCurrency: string;
  adjustmentIndex: string;
  adjustmentFrequency: string;
  adjustmentBaseDate: string;
  nextAdjustmentDate: string;
  transportCostPerUnit: number | null;
  taxesIncluded: boolean;
  penaltyForUnderConsumption: number | null;
  penaltyForOverConsumption: number | null;
  penaltyCalculationMethod: string;
  latePaymentPenaltyPercent: number | null;
  latePaymentInterestPercent: number | null;
  effectiveFrom: string;
  effectiveTo: string;
  renewalDate: string;
  renewalNoticeDays: number | null;
  dailySchedulingDeadline: string;
  monthlyDeclarationDeadline: number | null;
  active: boolean;
  notes: string;
  unitIds: string[];
}

// Threshold for low confidence fields
const LOW_CONFIDENCE_THRESHOLD = 0.7;

function getFieldValue<T>(
  field: ExtractedField | undefined,
  defaultValue: T,
): T {
  if (!field || field.value === null || field.value === undefined) {
    return defaultValue;
  }
  return field.value as T;
}

function getConfidence(field: ExtractedField | undefined): number {
  return field?.confidence ?? 0;
}

function isLowConfidence(field: ExtractedField | undefined): boolean {
  return getConfidence(field) < LOW_CONFIDENCE_THRESHOLD;
}

function ConfidenceIndicator({
  confidence,
  source,
}: {
  confidence: number;
  source?: string;
}) {
  const isLow = confidence < LOW_CONFIDENCE_THRESHOLD;
  const percentage = Math.round(confidence * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
              isLow
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            )}
          >
            {isLow ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            <span>{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium">
            Confiança: {percentage}%{isLow && " - Revisão recomendada"}
          </p>
          {source && (
            <p className="text-muted-foreground mt-1 text-xs">
              Fonte: "{source}"
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ContractExtractionForm({
  extractedData,
  onSubmit,
  isSubmitting = false,
}: ContractExtractionFormProps) {
  const client = useClientQueries(schema);
  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const form = useForm({
    defaultValues: {
      // Basic Data
      name: getFieldValue(extractedData.name, ""),
      contractNumber: getFieldValue(extractedData.contractNumber, ""),
      supplier: getFieldValue(extractedData.supplier, ""),
      supplierCnpj: getFieldValue(extractedData.supplierCnpj, ""),

      // Volumes and Flexibilities
      qdcContracted: getFieldValue(extractedData.qdcContracted, 0),
      volumeUnit: getFieldValue(extractedData.volumeUnit, "m3"),
      transportToleranceUpperPercent: getFieldValue(
        extractedData.transportToleranceUpperPercent,
        10,
      ),
      transportToleranceLowerPercent: getFieldValue(
        extractedData.transportToleranceLowerPercent,
        20,
      ),
      moleculeTolerancePercent: getFieldValue(
        extractedData.moleculeTolerancePercent,
        5,
      ),
      takeOrPayPercent: getFieldValue(extractedData.takeOrPayPercent, null) as
        | number
        | null,
      takeOrPayAccumulationMonths: getFieldValue(
        extractedData.takeOrPayAccumulationMonths,
        null,
      ) as number | null,
      takeOrPayExpirationMonths: getFieldValue(
        extractedData.takeOrPayExpirationMonths,
        null,
      ) as number | null,
      makeUpGasEnabled: getFieldValue(extractedData.makeUpGasEnabled, false),
      makeUpGasExpirationMonths: getFieldValue(
        extractedData.makeUpGasExpirationMonths,
        null,
      ) as number | null,
      makeUpGasMaxPercent: getFieldValue(
        extractedData.makeUpGasMaxPercent,
        null,
      ) as number | null,
      flexibilityUpPercent: getFieldValue(
        extractedData.flexibilityUpPercent,
        null,
      ) as number | null,
      flexibilityDownPercent: getFieldValue(
        extractedData.flexibilityDownPercent,
        null,
      ) as number | null,
      seasonalFlexibility: getFieldValue(
        extractedData.seasonalFlexibility,
        false,
      ),

      // Prices and Adjustments
      basePricePerUnit: getFieldValue(extractedData.basePricePerUnit, null) as
        | number
        | null,
      priceCurrency: getFieldValue(extractedData.priceCurrency, "BRL"),
      adjustmentIndex: getFieldValue(extractedData.adjustmentIndex, ""),
      adjustmentFrequency: getFieldValue(extractedData.adjustmentFrequency, ""),
      adjustmentBaseDate: getFieldValue(extractedData.adjustmentBaseDate, ""),
      nextAdjustmentDate: getFieldValue(extractedData.nextAdjustmentDate, ""),
      transportCostPerUnit: getFieldValue(
        extractedData.transportCostPerUnit,
        null,
      ) as number | null,
      taxesIncluded: getFieldValue(extractedData.taxesIncluded, false),

      // Penalties
      penaltyForUnderConsumption: getFieldValue(
        extractedData.penaltyForUnderConsumption,
        null,
      ) as number | null,
      penaltyForOverConsumption: getFieldValue(
        extractedData.penaltyForOverConsumption,
        null,
      ) as number | null,
      penaltyCalculationMethod: getFieldValue(
        extractedData.penaltyCalculationMethod,
        "",
      ),
      latePaymentPenaltyPercent: getFieldValue(
        extractedData.latePaymentPenaltyPercent,
        null,
      ) as number | null,
      latePaymentInterestPercent: getFieldValue(
        extractedData.latePaymentInterestPercent,
        null,
      ) as number | null,

      // Important Events/Dates
      effectiveFrom: getFieldValue(extractedData.effectiveFrom, ""),
      effectiveTo: getFieldValue(extractedData.effectiveTo, ""),
      renewalDate: getFieldValue(extractedData.renewalDate, ""),
      renewalNoticeDays: getFieldValue(
        extractedData.renewalNoticeDays,
        null,
      ) as number | null,
      dailySchedulingDeadline: getFieldValue(
        extractedData.dailySchedulingDeadline,
        "",
      ),
      monthlyDeclarationDeadline: getFieldValue(
        extractedData.monthlyDeclarationDeadline,
        null,
      ) as number | null,

      // General
      active: true,
      notes: getFieldValue(extractedData.notes, ""),

      // Linked units
      unitIds: [] as string[],
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

  // Helper to get field class based on confidence
  const getFieldClass = (fieldKey: string) => {
    const field = extractedData[fieldKey];
    if (isLowConfidence(field)) {
      return "ring-2 ring-yellow-400/50 dark:ring-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-900/10";
    }
    return "";
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* Alert banner */}
      <div className="bg-muted/50 rounded-lg border p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="text-sm">
            <p className="font-medium">
              Revise todos os campos antes de salvar
            </p>
            <p className="text-muted-foreground mt-1">
              Os dados foram extraídos automaticamente por IA. Campos com fundo
              amarelo têm baixa confiança e requerem atenção especial.
            </p>
          </div>
        </div>
      </div>

      {/* === Section 1: Basic Data === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados Básicos</h3>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Nome do Contrato *</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.name)}
                    source={extractedData.name?.source}
                  />
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Ex: Contrato Petrobras 2024"
                  className={getFieldClass("name")}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Número do Contrato</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.contractNumber)}
                    source={extractedData.contractNumber?.source}
                  />
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Ex: CT-2024-001"
                  className={getFieldClass("contractNumber")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="supplier">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Fornecedor</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.supplier)}
                    source={extractedData.supplier?.source}
                  />
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Nome do fornecedor/distribuidora"
                  className={getFieldClass("supplier")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="supplierCnpj">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>CNPJ do Fornecedor</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.supplierCnpj)}
                    source={extractedData.supplierCnpj?.source}
                  />
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="00.000.000/0000-00"
                  className={getFieldClass("supplierCnpj")}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* === Section 2: Volumes and Flexibilities === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Volumes e Flexibilidades</h3>
        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <form.Field name="qdcContracted">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>QDC *</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.qdcContracted)}
                    source={extractedData.qdcContracted?.source}
                  />
                </div>
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
                  className={getFieldClass("qdcContracted")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="volumeUnit">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Unidade</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.volumeUnit)}
                  />
                </div>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                  className={getFieldClass("volumeUnit")}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Tol. Transp. Sup. (%)</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.transportToleranceUpperPercent,
                    )}
                  />
                </div>
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
                  className={getFieldClass("transportToleranceUpperPercent")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="transportToleranceLowerPercent">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Tol. Transp. Inf. (%)</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.transportToleranceLowerPercent,
                    )}
                  />
                </div>
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
                  className={getFieldClass("transportToleranceLowerPercent")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="moleculeTolerancePercent">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Tol. Molécula (%)</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.moleculeTolerancePercent,
                    )}
                  />
                </div>
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
                  className={getFieldClass("moleculeTolerancePercent")}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name}>Take-or-Pay (%)</Label>
                    <ConfidenceIndicator
                      confidence={getConfidence(extractedData.takeOrPayPercent)}
                    />
                  </div>
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
                    className={getFieldClass("takeOrPayPercent")}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="takeOrPayAccumulationMonths">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Meses Acumulação</Label>
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
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="takeOrPayExpirationMonths">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Meses Expiração</Label>
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
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.makeUpGasEnabled)}
                  />
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
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="makeUpGasMaxPercent">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>% Máximo Recuperação</Label>
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
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* Flexibility */}
        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="flexibilityUpPercent">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Flex. Cima (%)</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.flexibilityUpPercent,
                    )}
                  />
                </div>
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
                  className={getFieldClass("flexibilityUpPercent")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="flexibilityDownPercent">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Flex. Baixo (%)</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.flexibilityDownPercent,
                    )}
                  />
                </div>
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
                  className={getFieldClass("flexibilityDownPercent")}
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

      {/* === Section 3: Prices and Adjustments === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preços e Reajustes</h3>
        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <form.Field name="basePricePerUnit">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Preço Base</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.basePricePerUnit)}
                  />
                </div>
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
                  className={getFieldClass("basePricePerUnit")}
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

          <form.Field name="adjustmentIndex">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Índice Reajuste</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.adjustmentIndex)}
                  />
                </div>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                  className={getFieldClass("adjustmentIndex")}
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
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <form.Field name="adjustmentFrequency">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Frequência</Label>
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
                <Label htmlFor={field.name}>Data Base</Label>
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

          <form.Field name="transportCostPerUnit">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Custo Transporte</Label>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Multa Subconsumo</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.penaltyForUnderConsumption,
                    )}
                  />
                </div>
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
                  className={getFieldClass("penaltyForUnderConsumption")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="penaltyForOverConsumption">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Multa Sobreconsumo</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.penaltyForOverConsumption,
                    )}
                  />
                </div>
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
                  className={getFieldClass("penaltyForOverConsumption")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="latePaymentPenaltyPercent">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Multa Atraso (%)</Label>
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
                />
              </div>
            )}
          </form.Field>

          <form.Field name="latePaymentInterestPercent">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Juros Mora (%)</Label>
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
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="penaltyCalculationMethod">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Método de Cálculo</Label>
                <ConfidenceIndicator
                  confidence={getConfidence(
                    extractedData.penaltyCalculationMethod,
                  )}
                />
              </div>
              <Textarea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
                rows={2}
                className={getFieldClass("penaltyCalculationMethod")}
              />
            </div>
          )}
        </form.Field>
      </div>

      {/* === Section 5: Important Events/Dates === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Datas Importantes</h3>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="effectiveFrom">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Data Início *</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.effectiveFrom)}
                    source={extractedData.effectiveFrom?.source}
                  />
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                  className={getFieldClass("effectiveFrom")}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Data Término</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(extractedData.effectiveTo)}
                  />
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="date"
                  value={field.state.value}
                  className={getFieldClass("effectiveTo")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="renewalDate">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Data Renovação</Label>
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
                <Label htmlFor={field.name}>Dias Antecedência</Label>
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
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="dailySchedulingDeadline">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Horário Programação</Label>
                  <ConfidenceIndicator
                    confidence={getConfidence(
                      extractedData.dailySchedulingDeadline,
                    )}
                  />
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="time"
                  value={field.state.value}
                  className={getFieldClass("dailySchedulingDeadline")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="monthlyDeclarationDeadline">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Dia Declaração Mensal</Label>
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
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* === Section 6: Link Units === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Unidades Consumidoras</h3>
        <Separator />
        <form.Field name="unitIds">
          {(field) => (
            <div className="space-y-2">
              <Label>Selecione as unidades vinculadas</Label>
              {(units as GasUnit[]).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma unidade consumidora cadastrada.
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
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

      {/* === Section 7: Notes === */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Observações</h3>
        <Separator />
        <form.Field name="notes">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>Observações Gerais</Label>
                <ConfidenceIndicator
                  confidence={getConfidence(extractedData.notes)}
                />
              </div>
              <Textarea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
                rows={3}
                className={getFieldClass("notes")}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe>
        {(state) => (
          <div className="bg-background sticky bottom-0 flex justify-end gap-2 border-t pt-4">
            <Button
              disabled={!state.canSubmit || state.isSubmitting || isSubmitting}
              type="submit"
              size="lg"
            >
              {state.isSubmitting || isSubmitting
                ? "Salvando..."
                : "Confirmar e Salvar Contrato"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
