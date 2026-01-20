import { useState } from "react";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import {
  Edit2,
  GripVertical,
  Loader2,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { customFieldTypes, entityTypes } from "../data/data";

interface FieldFormData {
  fieldName: string;
  displayName: string;
  fieldType: string;
  required: boolean;
  options: string;
  entityType: string;
}

const emptyField: FieldFormData = {
  fieldName: "",
  displayName: "",
  fieldType: "text",
  required: false,
  options: "",
  entityType: "contract",
};

export function CustomFieldsTab() {
  const client = useClientQueries(schema);
  const [selectedEntity, setSelectedEntity] = useState<string>("contract");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FieldFormData>(emptyField);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch custom fields
  const { data: fields = [], isLoading, refetch } = client.gasCustomField.useFindMany({
    where: { active: true, entityType: selectedEntity },
    orderBy: { orderIndex: "asc" },
  });

  // Create mutation
  const { mutate: createField, isPending: isCreating } =
    client.gasCustomField.useCreate({
      onSuccess: () => {
        toast.success("Campo criado com sucesso");
        setIsDialogOpen(false);
        setFormData({ ...emptyField, entityType: selectedEntity });
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao criar campo: ${error.message}`);
      },
    });

  // Update mutation
  const { mutate: updateField, isPending: isUpdating } =
    client.gasCustomField.useUpdate({
      onSuccess: () => {
        toast.success("Campo atualizado com sucesso");
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({ ...emptyField, entityType: selectedEntity });
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao atualizar campo: ${error.message}`);
      },
    });

  // Delete mutation
  const { mutate: deleteField, isPending: isDeleting } =
    client.gasCustomField.useDelete({
      onSuccess: () => {
        toast.success("Campo excluído com sucesso");
        setDeleteConfirmId(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao excluir campo: ${error.message}`);
      },
    });

  // Handle create new
  const handleCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyField, entityType: selectedEntity });
    setIsDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (field: typeof fields[0]) => {
    setEditingId(field.id);
    setFormData({
      fieldName: field.fieldName,
      displayName: field.displayName,
      fieldType: field.fieldType,
      required: field.required,
      options: field.options ?? "",
      entityType: field.entityType,
    });
    setIsDialogOpen(true);
  };

  // Handle save
  const handleSave = () => {
    if (!formData.fieldName.trim()) {
      toast.error("Nome do campo é obrigatório");
      return;
    }
    if (!formData.displayName.trim()) {
      toast.error("Label é obrigatório");
      return;
    }

    // Validate options for select type
    if (formData.fieldType === "select" && formData.options) {
      try {
        JSON.parse(formData.options);
      } catch {
        toast.error("Opções devem ser um array JSON válido");
        return;
      }
    }

    if (editingId) {
      updateField({
        where: { id: editingId },
        data: {
          fieldName: formData.fieldName,
          displayName: formData.displayName,
          fieldType: formData.fieldType,
          required: formData.required,
          options: formData.fieldType === "select" ? formData.options || null : null,
        },
      });
    } else {
      createField({
        data: {
          fieldName: formData.fieldName,
          displayName: formData.displayName,
          fieldType: formData.fieldType,
          required: formData.required,
          options: formData.fieldType === "select" ? formData.options || null : null,
          entityType: formData.entityType,
          orderIndex: fields.length,
        },
      });
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteField({ where: { id } });
  };

  // Handle toggle required
  const handleToggleRequired = (field: typeof fields[0]) => {
    updateField({
      where: { id: field.id },
      data: { required: !field.required },
    });
  };

  // Get field type label
  const getFieldTypeLabel = (type: string): string => {
    return customFieldTypes.find((t) => t.value === type)?.label ?? type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
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
              <Settings2 className="h-5 w-5 text-indigo-500" />
              <CardTitle>Campos Personalizados</CardTitle>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Campo
            </Button>
          </div>
          <CardDescription>
            Configure campos adicionais para contratos e unidades consumidoras.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={selectedEntity} onValueChange={setSelectedEntity}>
            <TabsList>
              {entityTypes.map((entity) => (
                <TabsTrigger key={entity.value} value={entity.value}>
                  {entity.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedEntity} className="mt-4">
              {fields.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  Nenhum campo personalizado cadastrado. Clique em "Novo Campo" para criar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Nome Interno</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Obrigatório</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <GripVertical className="text-muted-foreground h-4 w-4" />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {field.fieldName}
                        </TableCell>
                        <TableCell>{field.displayName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getFieldTypeLabel(field.fieldType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={field.required}
                            onCheckedChange={() => handleToggleRequired(field)}
                            disabled={isUpdating}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(field)}
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(field.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Campo" : "Novo Campo Personalizado"}
            </DialogTitle>
            <DialogDescription>
              Configure um campo adicional para{" "}
              {entityTypes.find((e) => e.value === formData.entityType)?.label.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fieldName">Nome Interno *</Label>
              <Input
                id="fieldName"
                value={formData.fieldName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                  })
                }
                placeholder="Ex: numero_processo"
                className="font-mono"
              />
              <p className="text-muted-foreground text-xs">
                Identificador único do campo (apenas letras, números e _).
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Label *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Ex: Número do Processo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fieldType">Tipo do Campo</Label>
              <NativeSelect
                id="fieldType"
                value={formData.fieldType}
                onChange={(e) =>
                  setFormData({ ...formData, fieldType: e.target.value })
                }
              >
                {customFieldTypes.map((type) => (
                  <NativeSelectOption key={type.value} value={type.value}>
                    {type.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            {formData.fieldType === "select" && (
              <div className="grid gap-2">
                <Label htmlFor="options">Opções (JSON array)</Label>
                <Textarea
                  id="options"
                  value={formData.options}
                  onChange={(e) =>
                    setFormData({ ...formData, options: e.target.value })
                  }
                  rows={3}
                  className="font-mono text-sm"
                  placeholder='["Opção 1", "Opção 2", "Opção 3"]'
                />
                <p className="text-muted-foreground text-xs">
                  Array JSON com as opções do campo de seleção.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, required: checked })
                }
              />
              <Label htmlFor="required">Campo obrigatório</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este campo personalizado? Esta ação não pode ser
              desfeita e pode afetar dados existentes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
