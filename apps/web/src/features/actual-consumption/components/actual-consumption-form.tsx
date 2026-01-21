import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { AlertTriangle, Calculator, CheckCircle, Info } from "lucide-react";

import type {
  ConsumptionSource,
  GasContract,
  GasDailyPlan,
  GasUnit,
} from "@acme/zen-v3/zenstack/models";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { consumptionSources } from "../data/data";

interface ActualConsumptionFormData {
  unitId: string;
  date: string;
  qdrValue: number;
  source: ConsumptionSource;
  meterReading: number | null;
  previousMeterReading: number | null;
  notes: string;
}

interface ActualConsumptionFormProps {
  defaultValues?: Partial<ActualConsumptionFormData>;
  onSubmit: (data: ActualConsumptionFormData) => void;
  isSubmitting?: boolean;
}

type UnitWithContract = GasUnit & { contract: GasContract | null };

export function ActualConsumptionForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ActualConsumptionFormProps) {
  const client = useClientQueries(schema);

  // Fetch active units with their contracts
  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    include: { contract: true },
    orderBy: { name: "asc" },
  });

  // Local state for tracking selected unit, date, and consumption values
  const [selectedUnitId, setSelectedUnitId] = useState(
    defaultValues?.unitId ?? "",
  );
  const [selectedDate, setSelectedDate] = useState(
    defaultValues?.date ?? new Date().toISOString().split("T")[0] ?? "",
  );
  const [actualVolume, setActualVolume] = useState(
    defaultValues?.qdrValue ?? 0,
  );
  const [selectedSource, setSelectedSource] = useState<ConsumptionSource>(
    defaultValues?.source ?? "meter",
  );
  const [meterReading, setMeterReading] = useState(
    defaultValues?.meterReading ?? null,
  );
  const [previousMeterReading, setPreviousMeterReading] = useState(
    defaultValues?.previousMeterReading ?? null,
  );

  // Fetch scheduled plan for the selected unit and date
  const { data: dailyPlan } = client.gasDailyPlan.useFindFirst({
    where: {
      unitId: selectedUnitId || undefined,
      date: selectedDate ? new Date(selectedDate) : undefined,
    },
  }) as { data: GasDailyPlan | null | undefined };

  // Calculate volume from meter readings when source is "meter"
  useEffect(() => {
    if (
      selectedSource === "meter" &&
      meterReading !== null &&
      previousMeterReading !== null
    ) {
      const calculatedVolume = meterReading - previousMeterReading;
      if (calculatedVolume >= 0) {
        setActualVolume(calculatedVolume);
      }
    }
  }, [selectedSource, meterReading, previousMeterReading]);

  const defaultDate =
    defaultValues?.date ?? new Date().toISOString().split("T")[0] ?? "";

  const form = useForm({
    defaultValues: {
      unitId: defaultValues?.unitId ?? "",
      date: defaultDate,
      qdrValue: defaultValues?.qdrValue ?? 0,
      source: defaultValues?.source ?? ("meter" as ConsumptionSource),
      meterReading: defaultValues?.meterReading ?? null,
      previousMeterReading: defaultValues?.previousMeterReading ?? null,
      notes: defaultValues?.notes ?? "",
    },
    onSubmit: ({ value }) => {
      onSubmit({
        unitId: value.unitId,
        date: value.date ?? defaultDate,
        qdrValue: actualVolume, // Use the tracked volume (may be calculated from meter readings)
        source: selectedSource,
        meterReading: selectedSource === "meter" ? meterReading : null,
        previousMeterReading:
          selectedSource === "meter" ? previousMeterReading : null,
        notes: value.notes,
      });
    },
  });

  const selectedUnit = (units as UnitWithContract[]).find(
    (u) => u.id === selectedUnitId,
  );
  const contract = selectedUnit?.contract;

  // Calculate deviation between scheduled and actual
  const scheduledVolume = dailyPlan?.qdpValue ?? 0;
  const deviation = scheduledVolume > 0 ? actualVolume - scheduledVolume : 0;
  const deviationPercent =
    scheduledVolume > 0 ? (deviation / scheduledVolume) * 100 : 0;
  const hasSchedule = !!dailyPlan;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <form.Field name="unitId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Unidade Consumidora *</Label>
              <NativeSelect
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  setSelectedUnitId(e.target.value);
                }}
                value={field.state.value}
              >
                <NativeSelectOption value="">
                  Selecione uma unidade
                </NativeSelectOption>
                {(units as UnitWithContract[]).map((unit) => (
                  <NativeSelectOption key={unit.id} value={unit.id}>
                    {unit.name} ({unit.code})
                    {unit.contract ? ` - ${unit.contract.name}` : ""}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {field.state.meta.errors.map((error) => (
                <p className="text-destructive text-sm" key={String(error)}>
                  {String(error)}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="date">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Data da Leitura *</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  setSelectedDate(e.target.value);
                }}
                type="date"
                value={field.state.value}
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-destructive text-sm" key={String(error)}>
                  {String(error)}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      {/* Show scheduled volume if available */}
      {hasSchedule && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Programação para esta data</AlertTitle>
          <AlertDescription>
            <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
              <div>
                <span className="font-medium">Volume Programado (QDP):</span>{" "}
                {scheduledVolume.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}{" "}
                {contract?.volumeUnit ?? "m³"}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {dailyPlan?.submitted ? (
                  <Badge variant="secondary">Enviado</Badge>
                ) : (
                  <Badge variant="outline">Pendente</Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasSchedule && selectedUnitId && selectedDate && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sem programação para esta data</AlertTitle>
          <AlertDescription>
            Não há programação registrada para esta unidade nesta data. O
            consumo real será registrado, mas não haverá comparação com o valor
            programado.
          </AlertDescription>
        </Alert>
      )}

      {/* Source selection */}
      <form.Field name="source">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Fonte da Medição *</Label>
            <NativeSelect
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => {
                const value = e.target.value as ConsumptionSource;
                field.handleChange(value);
                setSelectedSource(value);
              }}
              value={selectedSource}
            >
              {consumptionSources.map((source) => (
                <NativeSelectOption key={source.value} value={source.value}>
                  {source.label} - {source.description}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
      </form.Field>

      {/* Meter reading fields - only show when source is "meter" */}
      {selectedSource === "meter" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="previousMeterReading">Leitura Anterior</Label>
            <Input
              id="previousMeterReading"
              type="number"
              step="0.01"
              value={previousMeterReading ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setPreviousMeterReading(val);
              }}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meterReading">Leitura Atual</Label>
            <Input
              id="meterReading"
              type="number"
              step="0.01"
              value={meterReading ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setMeterReading(val);
              }}
              placeholder="0.00"
            />
          </div>
          {meterReading !== null && previousMeterReading !== null && (
            <div className="md:col-span-2">
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertTitle>Volume Calculado</AlertTitle>
                <AlertDescription>
                  {meterReading} - {previousMeterReading} ={" "}
                  <strong>
                    {(meterReading - previousMeterReading).toLocaleString(
                      "pt-BR",
                      { maximumFractionDigits: 2 },
                    )}{" "}
                    {contract?.volumeUnit ?? "m³"}
                  </strong>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )}

      {/* Direct volume input - show when source is not "meter" or as override */}
      {selectedSource !== "meter" && (
        <form.Field name="qdrValue">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Volume Consumido (QDR) *</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  field.handleChange(val);
                  setActualVolume(val);
                }}
                type="number"
                step="0.01"
                value={actualVolume}
                placeholder="0.00"
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-destructive text-sm" key={String(error)}>
                  {String(error)}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      )}

      {/* Show volume from meter reading calculation when source is meter */}
      {selectedSource === "meter" && actualVolume > 0 && (
        <div className="space-y-2">
          <Label>Volume Consumido (QDR)</Label>
          <div className="bg-muted rounded-md p-3">
            <span className="text-lg font-bold">
              {actualVolume.toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })}{" "}
              {contract?.volumeUnit ?? "m³"}
            </span>
            <span className="text-muted-foreground ml-2 text-sm">
              (calculado da leitura do medidor)
            </span>
          </div>
        </div>
      )}

      {/* Deviation calculation */}
      {hasSchedule && actualVolume > 0 && (
        <Alert
          variant={Math.abs(deviationPercent) > 10 ? "destructive" : "default"}
        >
          {Math.abs(deviationPercent) <= 10 ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>Desvio do Programado</AlertTitle>
          <AlertDescription>
            <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
              <div>
                <span className="font-medium">Programado:</span>{" "}
                {scheduledVolume.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}{" "}
                {contract?.volumeUnit ?? "m³"}
              </div>
              <div>
                <span className="font-medium">Realizado:</span>{" "}
                {actualVolume.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}{" "}
                {contract?.volumeUnit ?? "m³"}
              </div>
              <div>
                <span className="font-medium">Desvio:</span>{" "}
                <span
                  className={
                    deviation > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : deviation < 0
                        ? "text-blue-600 dark:text-blue-400"
                        : ""
                  }
                >
                  {deviation > 0 ? "+" : ""}
                  {deviation.toLocaleString("pt-BR", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  ({deviationPercent > 0 ? "+" : ""}
                  {deviationPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
            {Math.abs(deviationPercent) > 10 && (
              <p className="mt-2 text-sm">
                {deviation > 0
                  ? "Consumo acima do programado pode gerar penalidades."
                  : "Consumo abaixo do programado pode gerar penalidades de take-or-pay."}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form.Field name="notes">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Observações</Label>
            <Textarea
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              value={field.state.value}
              placeholder="Observações sobre esta medição..."
              rows={3}
            />
          </div>
        )}
      </form.Field>

      <form.Subscribe>
        {(state) => (
          <div className="flex justify-end gap-2 pt-4">
            <Button
              disabled={!state.canSubmit || state.isSubmitting || isSubmitting}
              type="submit"
            >
              {state.isSubmitting || isSubmitting
                ? "Salvando..."
                : "Registrar Consumo"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
