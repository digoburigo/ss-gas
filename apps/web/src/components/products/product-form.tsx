import { useForm } from "@tanstack/react-form";
import * as z from "zod";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@acme/ui/native-select";

interface ProductFormData {
  code: string;
  name: string;
  category: string;
  unit: string;
  costPrice: string;
  salePrice: string;
  minimumStock: string;
  storageLocation: string;
  active: boolean;
}

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: ProductFormProps) {
  const form = useForm({
    defaultValues: {
      code: defaultValues?.code ?? "",
      name: defaultValues?.name ?? "",
      category: defaultValues?.category ?? "",
      unit: defaultValues?.unit ?? "",
      costPrice: defaultValues?.costPrice ?? "",
      salePrice: defaultValues?.salePrice ?? "",
      minimumStock: defaultValues?.minimumStock ?? "",
      storageLocation: defaultValues?.storageLocation ?? "",
      active: defaultValues?.active ?? true,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: z.object({
        code: z.string().min(1, "Código é obrigatório"),
        name: z.string().min(1, "Nome do produto é obrigatório"),
        category: z.string().optional(),
        unit: z.string().optional(),
        costPrice: z
          .string()
          .optional()
          .refine(
            (val) => !val || !isNaN(parseFloat(val)),
            "Preço de custo deve ser um número válido",
          ),
        salePrice: z
          .string()
          .optional()
          .refine(
            (val) => !val || !isNaN(parseFloat(val)),
            "Preço de venda deve ser um número válido",
          ),
        minimumStock: z
          .string()
          .optional()
          .refine(
            (val) => !val || !isNaN(parseInt(val, 10)),
            "Estoque mínimo deve ser um número válido",
          ),
        storageLocation: z.string().optional(),
        active: z.boolean(),
      }),
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field name="code">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Código *</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="text"
                value={field.state.value}
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-sm text-destructive" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nome do Produto *</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="text"
                value={field.state.value}
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-sm text-destructive" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="category">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Categoria</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="text"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="unit">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Unidade</Label>
              <NativeSelect
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              >
                <NativeSelectOption value="">Selecione...</NativeSelectOption>
                <NativeSelectOption value="un">Unidade (un)</NativeSelectOption>
                <NativeSelectOption value="kg">Quilograma (kg)</NativeSelectOption>
                <NativeSelectOption value="g">Grama (g)</NativeSelectOption>
                <NativeSelectOption value="l">Litro (l)</NativeSelectOption>
                <NativeSelectOption value="ml">Mililitro (ml)</NativeSelectOption>
                <NativeSelectOption value="m">Metro (m)</NativeSelectOption>
                <NativeSelectOption value="cm">Centímetro (cm)</NativeSelectOption>
                <NativeSelectOption value="m²">Metro quadrado (m²)</NativeSelectOption>
                <NativeSelectOption value="m³">Metro cúbico (m³)</NativeSelectOption>
              </NativeSelect>
            </div>
          )}
        </form.Field>

        <form.Field name="costPrice">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Preço de Custo</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="number"
                step="0.01"
                value={field.state.value}
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-sm text-destructive" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="salePrice">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Preço de Venda</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="number"
                step="0.01"
                value={field.state.value}
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-sm text-destructive" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="minimumStock">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Estoque Mínimo</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="number"
                value={field.state.value}
              />
              {field.state.meta.errors.map((error) => (
                <p className="text-sm text-destructive" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="storageLocation">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Local de Armazenamento</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="text"
                value={field.state.value}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="active">
        {(field) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={field.state.value}
              id={field.name}
              onCheckedChange={(checked) =>
                field.handleChange(checked === true)
              }
            />
            <Label
              className="!mt-0 cursor-pointer"
              htmlFor={field.name}
            >
              Produto ativo
            </Label>
          </div>
        )}
      </form.Field>

      <form.Subscribe>
        {(state) => (
          <div className="flex justify-end gap-2">
            <Button
              disabled={!state.canSubmit || state.isSubmitting || isSubmitting}
              type="submit"
            >
              {state.isSubmitting || isSubmitting
                ? "Salvando..."
                : "Salvar Produto"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}

