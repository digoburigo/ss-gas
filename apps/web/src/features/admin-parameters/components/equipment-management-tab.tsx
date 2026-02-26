import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import {
  CalendarIcon,
  Cog,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import type {
  GasEquipment,
  GasEquipmentConstant,
  GasUnit,
} from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { Skeleton } from "@acme/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { api } from "~/clients/api-client";
import { ConfirmDialog } from "~/components/confirm-dialog";

// --- Types ---

type EquipmentWithRelations = GasEquipment & {
  unit?: Pick<GasUnit, "id" | "name" | "code"> | null;
  constants?: GasEquipmentConstant[];
};

type DialogType =
  | "create"
  | "update"
  | "delete"
  | "toggle-active"
  | "constants";

const equipmentTypeLabels: Record<string, string> = {
  atomizer: "Atomizador",
  line: "Linha",
  dryer: "Secador",
};

const equipmentTypeOptions = [
  { value: "atomizer", label: "Atomizador" },
  { value: "line", label: "Linha" },
  { value: "dryer", label: "Secador" },
];

const consumptionUnitLabels: Record<string, string> = {
  m3_per_hour: "m³/h",
  m3_per_day: "m³/dia",
};

const consumptionUnitOptions = [
  { value: "m3_per_hour", label: "m³/h" },
  { value: "m3_per_day", label: "m³/dia" },
];

// --- Equipment Form ---

interface EquipmentFormData {
  code: string;
  name: string;
  type: string;
  unitId: string;
  orderIndex: number;
  active: boolean;
}

function EquipmentForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: {
  defaultValues?: Partial<EquipmentFormData>;
  onSubmit: (data: EquipmentFormData) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const client = useClientQueries(schema);
  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const form = useForm({
    defaultValues: {
      code: defaultValues?.code ?? "",
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "line",
      unitId: defaultValues?.unitId ?? "",
      orderIndex: defaultValues?.orderIndex ?? 0,
      active: defaultValues?.active ?? true,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: z.object({
        code: z.string().min(1, "Código é obrigatório"),
        name: z.string().min(1, "Nome é obrigatório"),
        type: z.string().min(1, "Tipo é obrigatório"),
        unitId: z.string().min(1, "Unidade consumidora é obrigatória"),
        orderIndex: z.number().min(0),
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
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
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
                  placeholder="Ex: EQ-001"
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
                  placeholder="Nome do equipamento"
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

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="type">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Tipo *</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  {equipmentTypeOptions.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
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

          <form.Field name="unitId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Unidade Consumidora *</Label>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  <NativeSelectOption value="">
                    Selecione uma unidade
                  </NativeSelectOption>
                  {(units as GasUnit[]).map((unit) => (
                    <NativeSelectOption key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name}
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

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="orderIndex">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Ordem de Exibição</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(Number.parseInt(e.target.value) || 0)
                  }
                  type="number"
                  value={field.state.value}
                  min={0}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="active">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Status</Label>
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
              </div>
            )}
          </form.Field>
        </div>
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
                : "Salvar Equipamento"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}

// --- Constants Management ---

function ConstantsPanel({
  equipment,
  onClose,
}: {
  equipment: EquipmentWithRelations;
  onClose: () => void;
}) {
  const client = useClientQueries(schema);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    data: constants = [],
    isLoading,
    refetch,
  } = client.gasEquipmentConstant.useFindMany({
    where: { equipmentId: equipment.id },
    orderBy: { effectiveFrom: "desc" },
  });

  const { mutate: createConstant, isPending: isCreating } =
    client.gasEquipmentConstant.useCreate({
      onSuccess: () => {
        toast.success("Constante adicionada com sucesso");
        setShowAddForm(false);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro: ${error.message}`);
      },
    });

  const { mutate: deleteConstant } = client.gasEquipmentConstant.useDelete({
    onSuccess: () => {
      toast.success("Constante removida");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const { mutate: updateConstant } = client.gasEquipmentConstant.useUpdate({
    onSuccess: () => {
      toast.success("Constante atualizada");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const constantForm = useForm({
    defaultValues: {
      consumptionRate: 0,
      consumptionUnit: "m3_per_hour",
      effectiveFrom: new Date().toISOString().split("T")[0] ?? "",
      effectiveTo: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      createConstant({
        data: {
          equipmentId: equipment.id,
          consumptionRate: value.consumptionRate,
          consumptionUnit: value.consumptionUnit as
            | "m3_per_hour"
            | "m3_per_day",
          effectiveFrom: new Date(value.effectiveFrom),
          effectiveTo: value.effectiveTo
            ? new Date(value.effectiveTo)
            : undefined,
          notes: value.notes || undefined,
        },
      });
    },
    validators: {
      onSubmit: z.object({
        consumptionRate: z.number().min(0, "Taxa deve ser positiva"),
        consumptionUnit: z.string(),
        effectiveFrom: z.string().min(1, "Data de início é obrigatória"),
        effectiveTo: z.string(),
        notes: z.string(),
      }),
    },
  });

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-start">
          <SheetTitle>
            Constantes de Consumo - {equipment.name}
          </SheetTitle>
          <SheetDescription>
            Gerencie as constantes de consumo com faixas de vigência para este
            equipamento.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4 py-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "secondary" : "default"}
            >
              <Plus className="mr-1 h-4 w-4" />
              {showAddForm ? "Cancelar" : "Nova Constante"}
            </Button>
          </div>

          {showAddForm && (
            <Card>
              <CardContent className="pt-4">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    constantForm.handleSubmit();
                  }}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <constantForm.Field name="consumptionRate">
                      {(field) => (
                        <div className="space-y-1">
                          <Label htmlFor={field.name}>Taxa de Consumo *</Label>
                          <Input
                            id={field.name}
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                      )}
                    </constantForm.Field>

                    <constantForm.Field name="consumptionUnit">
                      {(field) => (
                        <div className="space-y-1">
                          <Label htmlFor={field.name}>Unidade</Label>
                          <NativeSelect
                            id={field.name}
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value)
                            }
                          >
                            {consumptionUnitOptions.map((opt) => (
                              <NativeSelectOption
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </div>
                      )}
                    </constantForm.Field>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <constantForm.Field name="effectiveFrom">
                      {(field) => (
                        <div className="space-y-1">
                          <Label htmlFor={field.name}>Vigência Início *</Label>
                          <Input
                            id={field.name}
                            type="date"
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value)
                            }
                          />
                        </div>
                      )}
                    </constantForm.Field>

                    <constantForm.Field name="effectiveTo">
                      {(field) => (
                        <div className="space-y-1">
                          <Label htmlFor={field.name}>Vigência Fim</Label>
                          <Input
                            id={field.name}
                            type="date"
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value)
                            }
                          />
                        </div>
                      )}
                    </constantForm.Field>
                  </div>

                  <constantForm.Field name="notes">
                    {(field) => (
                      <div className="space-y-1">
                        <Label htmlFor={field.name}>Observações</Label>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Notas opcionais"
                        />
                      </div>
                    )}
                  </constantForm.Field>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isCreating}>
                      {isCreating ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : null}
                      Salvar Constante
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (constants as GasEquipmentConstant[]).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CalendarIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  Nenhuma constante cadastrada.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {(constants as GasEquipmentConstant[]).map((constant) => (
                <Card key={constant.id}>
                  <CardContent className="flex items-center justify-between pt-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {constant.consumptionRate}{" "}
                          {consumptionUnitLabels[constant.consumptionUnit] ??
                            constant.consumptionUnit}
                        </span>
                        {!constant.effectiveTo && (
                          <Badge variant="default" className="text-xs">
                            Vigente
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        De{" "}
                        {new Date(constant.effectiveFrom).toLocaleDateString(
                          "pt-BR",
                        )}
                        {constant.effectiveTo
                          ? ` até ${new Date(constant.effectiveTo).toLocaleDateString("pt-BR")}`
                          : " (sem fim)"}
                      </p>
                      {constant.notes && (
                        <p className="text-muted-foreground mt-1 text-xs italic">
                          {constant.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!constant.effectiveTo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Encerrar vigência hoje"
                          onClick={() => {
                            updateConstant({
                              where: { id: constant.id },
                              data: { effectiveTo: new Date() },
                            });
                          }}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir constante"
                        onClick={() => {
                          deleteConstant({ where: { id: constant.id } });
                        }}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- Main Tab Component ---

export function EquipmentManagementTab() {
  const client = useClientQueries(schema);

  // Dialog state
  const [dialogType, setDialogType] = useState<DialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<EquipmentWithRelations | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Data fetching
  const {
    data: equipment = [],
    isLoading,
    refetch,
  } = client.gasEquipment.useFindMany({
    take: 200,
    include: {
      unit: {
        select: { id: true, name: true, code: true },
      },
      constants: true,
    },
    orderBy: { orderIndex: "asc" },
  });

  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // Mutations
  const { mutate: createEquipment, isPending: isCreating } =
    client.gasEquipment.useCreate({
      onSuccess: () => {
        toast.success("Equipamento criado com sucesso");
        setDialogType(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro: ${error.message}`);
      },
    });

  const { mutate: updateEquipment, isPending: isUpdating } =
    client.gasEquipment.useUpdate({
      onSuccess: () => {
        toast.success("Equipamento atualizado com sucesso");
        setDialogType(null);
        setCurrentRow(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro: ${error.message}`);
      },
    });

  const { mutateAsync: deleteEquipment } = client.gasEquipment.useDelete({
    onSuccess: () => {
      toast.success("Equipamento excluído com sucesso");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Handlers
  const handleCreate = async (data: EquipmentFormData) => {
    createEquipment({
      data: {
        code: data.code,
        name: data.name,
        type: data.type as "atomizer" | "line" | "dryer",
        unitId: data.unitId,
        orderIndex: data.orderIndex,
        active: data.active,
      },
    });
  };

  const handleUpdate = async (data: EquipmentFormData) => {
    if (!currentRow) return;
    updateEquipment({
      data: {
        code: data.code,
        name: data.name,
        type: data.type as "atomizer" | "line" | "dryer",
        unitId: data.unitId,
        orderIndex: data.orderIndex,
        active: data.active,
      },
      where: { id: currentRow.id },
    });
  };

  const handleToggleActive = async () => {
    if (!currentRow) return;
    updateEquipment({
      data: { active: !currentRow.active },
      where: { id: currentRow.id },
    });
  };

  const handleDelete = async () => {
    if (!currentRow) return;
    setDeleteError(null);

    try {
      const response = await api.gas
        .equipment({ equipmentId: currentRow.id })
        ["can-delete"].get();

      if (response.data && typeof response.data === "object" && "canDelete" in response.data && !response.data.canDelete) {
        setDeleteError(
          (response.data as { reason?: string }).reason ??
            "Não é possível excluir este equipamento.",
        );
        return;
      }

      await deleteEquipment({ where: { id: currentRow.id } });
      setDialogType(null);
      setCurrentRow(null);
    } catch {
      try {
        await deleteEquipment({ where: { id: currentRow.id } });
        setDialogType(null);
        setCurrentRow(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao excluir";
        toast.error(msg);
      }
    }
  };

  // Table columns
  const columns: ColumnDef<EquipmentWithRelations>[] = [
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <span className="max-w-48 truncate font-medium">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.getValue<string>("type");
        return (
          <Badge variant="outline">
            {equipmentTypeLabels[type] ?? type}
          </Badge>
        );
      },
    },
    {
      id: "unit",
      header: "Unidade",
      cell: ({ row }) => {
        const unit = row.original.unit;
        return unit ? (
          <span className="text-sm">
            {unit.code} - {unit.name}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "currentConstant",
      header: "Constante Atual",
      cell: ({ row }) => {
        const constants = row.original.constants ?? [];
        const current = (constants as GasEquipmentConstant[]).find(
          (c) => !c.effectiveTo,
        );
        if (!current) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <span className="text-sm">
            {current.consumptionRate}{" "}
            {consumptionUnitLabels[current.consumptionUnit] ??
              current.consumptionUnit}
          </span>
        );
      },
    },
    {
      accessorKey: "orderIndex",
      header: "Ordem",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("orderIndex")}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue<boolean>("active");
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Ativo" : "Inativo"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original);
                setDialogType("update");
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original);
                setDialogType("constants");
              }}
            >
              <Cog className="mr-2 h-4 w-4" />
              Constantes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original);
                setDialogType("toggle-active");
              }}
            >
              <Power className="mr-2 h-4 w-4" />
              {row.original.active ? "Desativar" : "Ativar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original);
                setDialogType("delete");
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Filtered data
  const filteredData = (equipment as EquipmentWithRelations[]).filter((eq) => {
    if (
      searchFilter &&
      !eq.name.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !eq.code.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    if (typeFilter && eq.type !== typeFilter) return false;
    if (unitFilter && eq.unitId !== unitFilter) return false;
    if (statusFilter === "active" && !eq.active) return false;
    if (statusFilter === "inactive" && eq.active) return false;
    return true;
  });

  // Table
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-blue-500" />
              <CardTitle>Equipamentos</CardTitle>
            </div>
            <Button size="sm" onClick={() => setDialogType("create")}>
              <Plus className="mr-1 h-4 w-4" />
              Novo Equipamento
            </Button>
          </div>
          <CardDescription>
            Gerencie equipamentos, vincule a unidades consumidoras e configure
            constantes de consumo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <NativeSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
            >
              <NativeSelectOption value="">Todos os tipos</NativeSelectOption>
              {equipmentTypeOptions.map((opt) => (
                <NativeSelectOption key={opt.value} value={opt.value}>
                  {opt.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-52"
            >
              <NativeSelectOption value="">Todas as unidades</NativeSelectOption>
              {(units as GasUnit[]).map((unit) => (
                <NativeSelectOption key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-32"
            >
              <NativeSelectOption value="">Todos</NativeSelectOption>
              <NativeSelectOption value="active">Ativos</NativeSelectOption>
              <NativeSelectOption value="inactive">Inativos</NativeSelectOption>
            </NativeSelect>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Nenhum equipamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination info */}
          <div className="text-muted-foreground text-sm">
            {filteredData.length} equipamento(s) encontrado(s)
            {filteredData.length !== (equipment as EquipmentWithRelations[]).length &&
              ` de ${(equipment as EquipmentWithRelations[]).length} total`}
          </div>
        </CardContent>
      </Card>

      {/* Create Drawer */}
      <Sheet
        open={dialogType === "create"}
        onOpenChange={(v) => !v && setDialogType(null)}
      >
        <SheetContent className="flex flex-col overflow-y-auto sm:max-w-lg">
          <SheetHeader className="text-start">
            <SheetTitle>Novo Equipamento</SheetTitle>
            <SheetDescription>
              Adicione um novo equipamento preenchendo as informações abaixo.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-4 py-6">
            <EquipmentForm onSubmit={handleCreate} isSubmitting={isCreating} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Update Drawer */}
      {currentRow && dialogType === "update" && (
        <Sheet
          open
          onOpenChange={(v) => {
            if (!v) {
              setDialogType(null);
              setTimeout(() => setCurrentRow(null), 500);
            }
          }}
        >
          <SheetContent className="flex flex-col overflow-y-auto sm:max-w-lg">
            <SheetHeader className="text-start">
              <SheetTitle>Editar Equipamento</SheetTitle>
              <SheetDescription>
                Atualize as informações do equipamento.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 px-4 py-6">
              <EquipmentForm
                defaultValues={{
                  code: currentRow.code,
                  name: currentRow.name,
                  type: currentRow.type,
                  unitId: currentRow.unitId,
                  orderIndex: currentRow.orderIndex,
                  active: currentRow.active,
                }}
                onSubmit={handleUpdate}
                isSubmitting={isUpdating}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Toggle Active Dialog */}
      {currentRow && (
        <ConfirmDialog
          open={dialogType === "toggle-active"}
          onOpenChange={(v) => {
            if (!v) {
              setDialogType(null);
              setTimeout(() => setCurrentRow(null), 500);
            }
          }}
          handleConfirm={handleToggleActive}
          className="max-w-md"
          title={`${currentRow.active ? "Desativar" : "Ativar"} equipamento: ${currentRow.name}?`}
          desc={
            currentRow.active ? (
              <>
                Você está prestes a desativar o equipamento{" "}
                <strong>{currentRow.name}</strong>. <br />
                Ele não aparecerá mais nos lançamentos diários enquanto estiver
                inativo.
              </>
            ) : (
              <>
                Você está prestes a ativar o equipamento{" "}
                <strong>{currentRow.name}</strong>. <br />
                Ele voltará a aparecer nos lançamentos diários.
              </>
            )
          }
          confirmText={currentRow.active ? "Desativar" : "Ativar"}
        />
      )}

      {/* Delete Dialog */}
      {currentRow && (
        <ConfirmDialog
          destructive
          open={dialogType === "delete"}
          onOpenChange={(v) => {
            if (!v) {
              setDialogType(null);
              setDeleteError(null);
              setTimeout(() => setCurrentRow(null), 500);
            }
          }}
          handleConfirm={handleDelete}
          className="max-w-md"
          title={`Excluir equipamento: ${currentRow.name}?`}
          desc={
            <>
              {deleteError ? (
                <p className="text-destructive mb-2">{deleteError}</p>
              ) : null}
              Você está prestes a excluir o equipamento{" "}
              <strong>{currentRow.name}</strong>. <br />
              <strong className="text-destructive">
                Esta ação é irreversível e removerá todas as constantes
                associadas.
              </strong>
            </>
          }
          confirmText="Excluir"
        />
      )}

      {/* Constants Panel */}
      {currentRow && dialogType === "constants" && (
        <ConstantsPanel
          equipment={currentRow}
          onClose={() => {
            setDialogType(null);
            setTimeout(() => setCurrentRow(null), 500);
          }}
        />
      )}
    </>
  );
}
