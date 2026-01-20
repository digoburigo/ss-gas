import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { X } from "lucide-react";
import * as z from "zod";

import type { GasContract } from "@acme/zen-v3/zenstack/models";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

import {
  defaultAdvanceNoticeDays,
  eventTypeOptions,
  recurrenceOptions,
} from "../data/data";

interface ContractAlertFormData {
  contractId: string;
  eventType: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  recurrence: string;
  advanceNoticeDays: number[];
  recipientEmails: string[];
  active: boolean;
}

interface ContractAlertFormProps {
  defaultValues?: Partial<ContractAlertFormData>;
  onSubmit: (data: ContractAlertFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ContractAlertForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ContractAlertFormProps) {
  const client = useClientQueries(schema);
  const { data: contracts = [] } = client.gasContract.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const [emailInput, setEmailInput] = useState("");

  const form = useForm({
    defaultValues: {
      contractId: defaultValues?.contractId ?? "",
      eventType: defaultValues?.eventType ?? "custom",
      eventName: defaultValues?.eventName ?? "",
      eventDescription: defaultValues?.eventDescription ?? "",
      eventDate: defaultValues?.eventDate ?? "",
      eventTime: defaultValues?.eventTime ?? "",
      recurrence: defaultValues?.recurrence ?? "once",
      advanceNoticeDays:
        defaultValues?.advanceNoticeDays ?? defaultAdvanceNoticeDays,
      recipientEmails: defaultValues?.recipientEmails ?? [],
      active: defaultValues?.active ?? true,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: z.object({
        contractId: z.string().min(1, "Contrato é obrigatório"),
        eventType: z.string().min(1, "Tipo de evento é obrigatório"),
        eventName: z.string().min(1, "Nome do evento é obrigatório"),
        eventDescription: z.string().optional(),
        eventDate: z.string().optional(),
        eventTime: z.string().optional(),
        recurrence: z.string().min(1, "Recorrência é obrigatória"),
        advanceNoticeDays: z
          .array(z.number())
          .min(1, "Selecione ao menos uma antecedência"),
        recipientEmails: z
          .array(z.string().email())
          .min(1, "Adicione ao menos um destinatário"),
        active: z.boolean(),
      }),
    },
  });

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && z.string().email().safeParse(email).success) {
      const currentEmails = form.getFieldValue("recipientEmails");
      if (!currentEmails.includes(email)) {
        form.setFieldValue("recipientEmails", [...currentEmails, email]);
      }
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const currentEmails = form.getFieldValue("recipientEmails");
    form.setFieldValue(
      "recipientEmails",
      currentEmails.filter((e) => e !== emailToRemove),
    );
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleToggleAdvanceDay = (day: number) => {
    const currentDays = form.getFieldValue("advanceNoticeDays");
    if (currentDays.includes(day)) {
      form.setFieldValue(
        "advanceNoticeDays",
        currentDays.filter((d) => d !== day),
      );
    } else {
      form.setFieldValue(
        "advanceNoticeDays",
        [...currentDays, day].sort((a, b) => b - a),
      );
    }
  };

  // Watch event type to show/hide date field
  const eventType = form.getFieldValue("eventType");
  const showDateField = eventType === "custom";

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* Contract Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contrato</h3>
        <form.Field name="contractId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Contrato *</Label>
              <NativeSelect
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              >
                <NativeSelectOption value="">
                  Selecione um contrato
                </NativeSelectOption>
                {(contracts as GasContract[]).map((contract) => (
                  <NativeSelectOption key={contract.id} value={contract.id}>
                    {contract.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {field.state.meta.errors.map((error) => (
                <p className="text-destructive text-sm" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      {/* Event Definition */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Definição do Evento</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="eventType">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Tipo de Evento *</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    // Auto-fill event name based on type
                    const selectedType = eventTypeOptions.find(
                      (opt) => opt.value === e.target.value,
                    );
                    if (selectedType && e.target.value !== "custom") {
                      form.setFieldValue("eventName", selectedType.label);
                    }
                  }}
                  value={field.state.value}
                >
                  {eventTypeOptions.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="eventName">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nome do Evento *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Ex: Vencimento do Contrato ABC"
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

        <form.Field name="eventDescription">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Descrição</Label>
              <Textarea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
                placeholder="Descrição adicional do evento"
                rows={2}
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

      {/* Date and Recurrence */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Data e Recorrência</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {showDateField && (
            <form.Field name="eventDate">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Data do Evento</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="date"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="text-destructive text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          )}

          <form.Field name="eventTime">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Horário</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="time"
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

          <form.Field name="recurrence">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Recorrência *</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  {recurrenceOptions.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        {!showDateField && (
          <p className="text-muted-foreground text-sm">
            Para eventos do tipo sistema (não personalizados), a data é obtida
            automaticamente do contrato selecionado.
          </p>
        )}
      </div>

      {/* Advance Notice */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Antecedência dos Alertas</h3>
        <form.Field name="advanceNoticeDays">
          {(field) => (
            <div className="space-y-2">
              <Label>Enviar alerta com antecedência de *</Label>
              <div className="flex flex-wrap gap-3">
                {[90, 60, 45, 30, 21, 15, 14, 7, 3, 2, 1].map((day) => (
                  <label
                    key={day}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={field.state.value.includes(day)}
                      onCheckedChange={() => handleToggleAdvanceDay(day)}
                    />
                    <span className="text-sm">
                      {day} {day === 1 ? "dia" : "dias"}
                    </span>
                  </label>
                ))}
              </div>
              {field.state.meta.errors.map((error) => (
                <p className="text-destructive text-sm" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      {/* Recipients */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Destinatários</h3>
        <form.Field name="recipientEmails">
          {(field) => (
            <div className="space-y-2">
              <Label>Emails dos Responsáveis *</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="Digite um email e pressione Enter"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddEmail}
                >
                  Adicionar
                </Button>
              </div>
              {field.state.value.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.state.value.map((email) => (
                    <span
                      key={email}
                      className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {field.state.meta.errors.map((error) => (
                <p className="text-destructive text-sm" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Status</h3>
        <form.Field name="active">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Status do Alerta</Label>
              <NativeSelect
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value === "true")}
                value={field.state.value ? "true" : "false"}
              >
                <NativeSelectOption value="true">Ativo</NativeSelectOption>
                <NativeSelectOption value="false">Inativo</NativeSelectOption>
              </NativeSelect>
              {field.state.meta.errors.map((error) => (
                <p className="text-destructive text-sm" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      <form.Subscribe>
        {(state) => (
          <div className="flex justify-end gap-2">
            <Button
              disabled={!state.canSubmit || state.isSubmitting || isSubmitting}
              type="submit"
            >
              {state.isSubmitting || isSubmitting
                ? "Salvando..."
                : "Salvar Alerta"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
