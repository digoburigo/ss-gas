import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { X } from "lucide-react";
import * as z from "zod";

import type { GasContract } from "@acme/zen-v3/zenstack/models";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

interface ConsumerUnitFormData {
  code: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  responsibleEmails: string[];
  contractId: string;
  active: boolean;
}

interface ConsumerUnitFormProps {
  defaultValues?: Partial<ConsumerUnitFormData>;
  onSubmit: (data: ConsumerUnitFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ConsumerUnitForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ConsumerUnitFormProps) {
  const client = useClientQueries(schema);
  const { data: contracts = [] } = client.gasContract.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const [emailInput, setEmailInput] = useState("");

  const form = useForm({
    defaultValues: {
      code: defaultValues?.code ?? "",
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      address: defaultValues?.address ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "",
      zipCode: defaultValues?.zipCode ?? "",
      responsibleEmails: defaultValues?.responsibleEmails ?? [],
      contractId: defaultValues?.contractId ?? "",
      active: defaultValues?.active ?? true,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: z.object({
        code: z.string().min(1, "Código do medidor é obrigatório"),
        name: z.string().min(1, "Nome é obrigatório"),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        responsibleEmails: z.array(z.string().email()),
        contractId: z.string().optional(),
        active: z.boolean(),
      }),
    },
  });

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && z.string().email().safeParse(email).success) {
      const currentEmails = form.getFieldValue("responsibleEmails");
      if (!currentEmails.includes(email)) {
        form.setFieldValue("responsibleEmails", [...currentEmails, email]);
      }
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const currentEmails = form.getFieldValue("responsibleEmails");
    form.setFieldValue(
      "responsibleEmails",
      currentEmails.filter((e) => e !== emailToRemove),
    );
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
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
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações do Ponto de Medição</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="code">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Código do Medidor *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Ex: UC-001"
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nome *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Nome da unidade consumidora"
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

        <form.Field name="description">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Descrição</Label>
              <Textarea
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
                placeholder="Descrição adicional do ponto de medição"
                rows={3}
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

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Endereço</h3>
        <div className="grid gap-4">
          <form.Field name="address">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Endereço</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="text"
                  value={field.state.value}
                  placeholder="Rua, número, complemento"
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 md:grid-cols-3">
            <form.Field name="city">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Cidade</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="text"
                    value={field.state.value}
                    placeholder="Cidade"
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

            <form.Field name="state">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Estado</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="text"
                    value={field.state.value}
                    placeholder="UF"
                    maxLength={2}
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

            <form.Field name="zipCode">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>CEP</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="text"
                    value={field.state.value}
                    placeholder="00000-000"
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
          </div>
        </div>
      </div>

      {/* Contract Linkage */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Vinculação ao Contrato</h3>
        <form.Field name="contractId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Contrato</Label>
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

      {/* Responsible Parties */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Responsáveis</h3>
        <form.Field name="responsibleEmails">
          {(field) => (
            <div className="space-y-2">
              <Label>Emails dos Responsáveis</Label>
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
              <Label htmlFor={field.name}>Status da Unidade</Label>
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
                : "Salvar Unidade Consumidora"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
