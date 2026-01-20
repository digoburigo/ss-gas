import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { AlertTriangle, Info } from "lucide-react";
import * as z from "zod";

import type { GasContract, GasUnit } from "@acme/zen-v3/zenstack/models";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

interface DailySchedulingFormData {
  unitId: string;
  date: string;
  qdpValue: number;
  volumeUnit: string;
  notes: string;
}

interface DailySchedulingFormProps {
  defaultValues?: Partial<DailySchedulingFormData>;
  onSubmit: (data: DailySchedulingFormData) => void;
  isSubmitting?: boolean;
}

type UnitWithContract = GasUnit & { contract: GasContract | null };

export function DailySchedulingForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: DailySchedulingFormProps) {
  const client = useClientQueries(schema);

  // Fetch active units with their contracts
  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    include: { contract: true },
    orderBy: { name: "asc" },
  });

  // Local state for tracking selected unit and volume for contract limit validation
  const [selectedUnitId, setSelectedUnitId] = useState(
    defaultValues?.unitId ?? "",
  );
  const [scheduledVolume, setScheduledVolume] = useState(
    defaultValues?.qdpValue ?? 0,
  );

  const defaultDate =
    defaultValues?.date ?? new Date().toISOString().split("T")[0] ?? "";

  const form = useForm({
    defaultValues: {
      unitId: defaultValues?.unitId ?? "",
      date: defaultDate,
      qdpValue: defaultValues?.qdpValue ?? 0,
      volumeUnit: defaultValues?.volumeUnit ?? "m3",
      notes: defaultValues?.notes ?? "",
    },
    onSubmit: ({ value }) => {
      onSubmit({
        unitId: value.unitId,
        date: value.date ?? defaultDate,
        qdpValue: value.qdpValue,
        volumeUnit: value.volumeUnit,
        notes: value.notes,
      });
    },
  });

  const selectedUnit = (units as UnitWithContract[]).find(
    (u) => u.id === selectedUnitId,
  );
  const contract = selectedUnit?.contract;

  // Calculate contract limits
  const qdcContracted = contract?.qdcContracted ?? 0;
  const upperTolerance = contract?.transportToleranceUpperPercent ?? 10;
  const lowerTolerance = contract?.transportToleranceLowerPercent ?? 20;

  const maxAllowed = qdcContracted * (1 + upperTolerance / 100);
  const minAllowed = qdcContracted * (1 - lowerTolerance / 100);

  // Check if volume is within limits
  const isAboveMax = scheduledVolume > maxAllowed && maxAllowed > 0;
  const isBelowMin = scheduledVolume < minAllowed && minAllowed > 0;
  const isOutOfRange = isAboveMax || isBelowMin;

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
              <Label htmlFor={field.name}>Data *</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
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

      {/* Contract limits info */}
      {contract && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Limites do Contrato: {contract.name}</AlertTitle>
          <AlertDescription>
            <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
              <div>
                <span className="font-medium">QDC Contratada:</span>{" "}
                {qdcContracted.toLocaleString("pt-BR")} {contract.volumeUnit}
              </div>
              <div>
                <span className="font-medium">
                  Mínimo (-{lowerTolerance}%):
                </span>{" "}
                {minAllowed.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}{" "}
                {contract.volumeUnit}
              </div>
              <div>
                <span className="font-medium">
                  Máximo (+{upperTolerance}%):
                </span>{" "}
                {maxAllowed.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}{" "}
                {contract.volumeUnit}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!contract && selectedUnit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unidade sem contrato vinculado</AlertTitle>
          <AlertDescription>
            Esta unidade não possui um contrato vinculado. Não será possível
            validar os limites de volume.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <form.Field name="qdpValue">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Volume Programado *</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  field.handleChange(val);
                  setScheduledVolume(val);
                }}
                type="number"
                step="0.01"
                value={field.state.value}
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
                <NativeSelectOption value="m3">m³</NativeSelectOption>
                <NativeSelectOption value="MMBtu">MMBtu</NativeSelectOption>
              </NativeSelect>
            </div>
          )}
        </form.Field>
      </div>

      {/* Warning if out of contract range */}
      {isOutOfRange && contract && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Volume fora dos limites do contrato</AlertTitle>
          <AlertDescription>
            {isAboveMax && (
              <p>
                O volume programado ({scheduledVolume.toLocaleString("pt-BR")})
                está acima do limite máximo permitido (
                {maxAllowed.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}
                ).
              </p>
            )}
            {isBelowMin && (
              <p>
                O volume programado ({scheduledVolume.toLocaleString("pt-BR")})
                está abaixo do limite mínimo permitido (
                {minAllowed.toLocaleString("pt-BR", {
                  maximumFractionDigits: 2,
                })}
                ).
              </p>
            )}
            <p className="mt-1 text-sm">
              A programação ainda pode ser salva, mas poderá gerar penalidades.
            </p>
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
              placeholder="Observações sobre esta programação..."
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
                : "Salvar Programação"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
