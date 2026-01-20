import { useState } from "react";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import {
  Copy,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Star,
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
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { contractTypes } from "../data/data";

interface TemplateFormData {
  name: string;
  description: string;
  contractType: string;
  templateValues: string;
  isDefault: boolean;
}

const emptyTemplate: TemplateFormData = {
  name: "",
  description: "",
  contractType: "",
  templateValues: JSON.stringify(
    {
      qdcContracted: 1000,
      volumeUnit: "m3",
      transportToleranceUpperPercent: 10,
      transportToleranceLowerPercent: 20,
      moleculeTolerancePercent: 5,
      takeOrPayPercent: 80,
      priceCurrency: "BRL",
    },
    null,
    2
  ),
  isDefault: false,
};

export function ContractTemplatesTab() {
  const client = useClientQueries(schema);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(emptyTemplate);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch templates
  const { data: templates = [], isLoading, refetch } = client.gasContractTemplate.useFindMany({
    where: { active: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  // Create mutation
  const { mutate: createTemplate, mutateAsync: createTemplateAsync, isPending: isCreating } =
    client.gasContractTemplate.useCreate({
      onSuccess: () => {
        toast.success("Template criado com sucesso");
        setIsDialogOpen(false);
        setFormData(emptyTemplate);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao criar template: ${error.message}`);
      },
    });

  // Update mutation
  const { mutate: updateTemplate, mutateAsync: updateTemplateAsync, isPending: isUpdating } =
    client.gasContractTemplate.useUpdate({
      onSuccess: () => {
        toast.success("Template atualizado com sucesso");
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData(emptyTemplate);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao atualizar template: ${error.message}`);
      },
    });

  // Delete mutation
  const { mutate: deleteTemplate, isPending: isDeleting } =
    client.gasContractTemplate.useDelete({
      onSuccess: () => {
        toast.success("Template excluído com sucesso");
        setDeleteConfirmId(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao excluir template: ${error.message}`);
      },
    });

  // Handle create new
  const handleCreate = () => {
    setEditingId(null);
    setFormData(emptyTemplate);
    setIsDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (template: typeof templates[0]) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description ?? "",
      contractType: template.contractType ?? "",
      templateValues: template.templateValues,
      isDefault: template.isDefault,
    });
    setIsDialogOpen(true);
  };

  // Handle duplicate
  const handleDuplicate = (template: typeof templates[0]) => {
    setEditingId(null);
    setFormData({
      name: `${template.name} (Cópia)`,
      description: template.description ?? "",
      contractType: template.contractType ?? "",
      templateValues: template.templateValues,
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  // Handle save
  const handleSave = () => {
    // Validate JSON
    try {
      JSON.parse(formData.templateValues);
    } catch {
      toast.error("Valores do template devem ser um JSON válido");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    if (editingId) {
      updateTemplate({
        where: { id: editingId },
        data: {
          name: formData.name,
          description: formData.description || null,
          contractType: formData.contractType || null,
          templateValues: formData.templateValues,
          isDefault: formData.isDefault,
        },
      });
    } else {
      createTemplate({
        data: {
          name: formData.name,
          description: formData.description || null,
          contractType: formData.contractType || null,
          templateValues: formData.templateValues,
          isDefault: formData.isDefault,
        },
      });
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteTemplate({ where: { id } });
  };

  // Handle set as default
  const handleSetDefault = async (id: string) => {
    // First, unset all defaults
    for (const template of templates) {
      if (template.isDefault && template.id !== id) {
        await updateTemplateAsync({
          where: { id: template.id },
          data: { isDefault: false },
        });
      }
    }
    // Set new default
    await updateTemplateAsync({
      where: { id },
      data: { isDefault: true },
    });
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
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
              <FileText className="h-5 w-5 text-green-500" />
              <CardTitle>Templates de Contrato</CardTitle>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </div>
          <CardDescription>
            Gerencie templates com valores padrão para novos contratos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              Nenhum template cadastrado. Clique em "Novo Template" para criar.
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        {template.isDefault && (
                          <Badge variant="default" className="text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Padrão
                          </Badge>
                        )}
                        {template.contractType && (
                          <Badge variant="outline" className="text-xs">
                            {contractTypes.find((t) => t.value === template.contractType)?.label ??
                              template.contractType}
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {template.description}
                        </p>
                      )}
                      <div className="bg-muted mt-3 rounded p-2">
                        <pre className="max-h-32 overflow-auto text-xs">
                          {JSON.stringify(JSON.parse(template.templateValues), null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-1">
                      {!template.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(template.id)}
                          title="Definir como padrão"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(template)}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(template.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              Configure os valores padrão para novos contratos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Contrato Industrial Padrão"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do template"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contractType">Tipo de Contrato</Label>
              <NativeSelect
                id="contractType"
                value={formData.contractType}
                onChange={(e) =>
                  setFormData({ ...formData, contractType: e.target.value })
                }
              >
                <NativeSelectOption value="">Todos os tipos</NativeSelectOption>
                {contractTypes.map((type) => (
                  <NativeSelectOption key={type.value} value={type.value}>
                    {type.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="templateValues">Valores do Template (JSON)</Label>
              <Textarea
                id="templateValues"
                value={formData.templateValues}
                onChange={(e) =>
                  setFormData({ ...formData, templateValues: e.target.value })
                }
                rows={10}
                className="font-mono text-sm"
                placeholder='{"qdcContracted": 1000, ...}'
              />
              <p className="text-muted-foreground text-xs">
                JSON com os valores padrão para campos do contrato.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isDefault">Usar como template padrão</Label>
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
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
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
