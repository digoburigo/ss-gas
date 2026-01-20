import { useState } from "react";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { AlertTriangle, Check, ClipboardList, Loader2, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";

import type { GasSystemParameter } from "@acme/zen-v3/zenstack/models";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { NativeSelect, NativeSelectOption } from "@acme/ui/native-select";
import { Skeleton } from "@acme/ui/skeleton";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { schema } from "@acme/zen-v3/zenstack/schema";

import {
  contractTypes,
  defaultBusinessRules,
  formatParameterValue,
} from "../data/data";

export function BusinessRulesTab() {
  const client = useClientQueries(schema);
  const [selectedContractType, setSelectedContractType] = useState<string>("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Fetch existing parameters for selected contract type
  const { data: parameters = [], isLoading, refetch } = client.gasSystemParameter.useFindMany({
    where: {
      category: "business_rules",
      active: true,
      ...(selectedContractType !== "all" ? { contractType: selectedContractType } : {}),
    },
    orderBy: { orderIndex: "asc" },
  });

  // Fetch all parameters for "all" view
  const { data: allParameters = [] } = client.gasSystemParameter.useFindMany({
    where: {
      category: "business_rules",
      active: true,
      contractType: null,
    },
    orderBy: { orderIndex: "asc" },
  });

  // Create mutation
  const { mutate: createParameter, mutateAsync: createParameterAsync, isPending: isCreating } =
    client.gasSystemParameter.useCreate({
      onSuccess: () => {
        toast.success("Regra criada com sucesso");
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao criar regra: ${error.message}`);
      },
    });

  // Update mutation
  const { mutate: updateParameter, isPending: isUpdating } =
    client.gasSystemParameter.useUpdate({
      onSuccess: () => {
        toast.success("Regra atualizada com sucesso");
        setEditingKey(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao atualizar regra: ${error.message}`);
      },
    });

  // Initialize default parameters if none exist
  const handleInitializeDefaults = async () => {
    const targetParams = selectedContractType === "all" ? allParameters : parameters;
    for (const param of defaultBusinessRules) {
      const exists = (targetParams as GasSystemParameter[]).some((p) => p.key === param.key);
      if (!exists) {
        await createParameterAsync({
          data: {
            category: "business_rules",
            key: param.key,
            name: param.name,
            description: param.description,
            value: param.defaultValue,
            valueType: param.valueType,
            defaultValue: param.defaultValue,
            minValue: "minValue" in param ? param.minValue : undefined,
            maxValue: "maxValue" in param ? param.maxValue : undefined,
            contractType: selectedContractType === "all" ? null : selectedContractType,
            orderIndex: defaultBusinessRules.indexOf(param),
          },
        });
      }
    }
  };

  // Get value for a parameter, using default if not found
  const getParameterValue = (key: string): string => {
    const targetParams = selectedContractType === "all" ? allParameters : parameters;
    const param = (targetParams as GasSystemParameter[]).find((p) => p.key === key);
    if (param) return param.value;
    const defaultParam = defaultBusinessRules.find((p) => p.key === key);
    return defaultParam?.defaultValue ?? "";
  };

  // Handle starting edit
  const handleEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(getParameterValue(key));
  };

  // Handle save
  const handleSave = (key: string) => {
    const targetParams = selectedContractType === "all" ? allParameters : parameters;
    const param = (targetParams as GasSystemParameter[]).find((p) => p.key === key);
    if (param) {
      updateParameter({
        where: { id: param.id },
        data: { value: editValue },
      });
    } else {
      const defaultParam = defaultBusinessRules.find((p) => p.key === key);
      if (defaultParam) {
        createParameter({
          data: {
            category: "business_rules",
            key: defaultParam.key,
            name: defaultParam.name,
            description: defaultParam.description,
            value: editValue,
            valueType: defaultParam.valueType,
            defaultValue: defaultParam.defaultValue,
            minValue: "minValue" in defaultParam ? defaultParam.minValue : undefined,
            maxValue: "maxValue" in defaultParam ? defaultParam.maxValue : undefined,
            contractType: selectedContractType === "all" ? null : selectedContractType,
            orderIndex: defaultBusinessRules.indexOf(defaultParam),
          },
        });
      }
    }
  };

  // Handle reset to default
  const handleReset = (key: string) => {
    const targetParams = selectedContractType === "all" ? allParameters : parameters;
    const param = (targetParams as GasSystemParameter[]).find((p) => p.key === key);
    const defaultParam = defaultBusinessRules.find((p) => p.key === key);
    if (param && defaultParam) {
      updateParameter({
        where: { id: param.id },
        data: { value: defaultParam.defaultValue },
      });
    }
  };

  // Handle boolean toggle
  const handleToggle = (key: string, newValue: boolean) => {
    setEditValue(newValue.toString());
    const targetParams = selectedContractType === "all" ? allParameters : parameters;
    const param = (targetParams as GasSystemParameter[]).find((p) => p.key === key);
    if (param) {
      updateParameter({
        where: { id: param.id },
        data: { value: newValue.toString() },
      });
    } else {
      const defaultParam = defaultBusinessRules.find((p) => p.key === key);
      if (defaultParam) {
        createParameter({
          data: {
            category: "business_rules",
            key: defaultParam.key,
            name: defaultParam.name,
            description: defaultParam.description,
            value: newValue.toString(),
            valueType: defaultParam.valueType,
            defaultValue: defaultParam.defaultValue,
            contractType: selectedContractType === "all" ? null : selectedContractType,
            orderIndex: defaultBusinessRules.indexOf(defaultParam),
          },
        });
      }
    }
  };

  const targetParams = selectedContractType === "all" ? allParameters : parameters;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-500" />
            <CardTitle>Regras de Negócio</CardTitle>
          </div>
          {targetParams.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitializeDefaults}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Inicializar Padrões
            </Button>
          )}
        </div>
        <CardDescription>
          Configure regras de negócio por tipo de contrato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Type Selector */}
        <Tabs value={selectedContractType} onValueChange={setSelectedContractType}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Padrão (Todos)</TabsTrigger>
            {contractTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedContractType} className="space-y-4">
            {defaultBusinessRules.map((defaultParam) => {
              const param = (targetParams as GasSystemParameter[]).find((p) => p.key === defaultParam.key);
              const isEditing = editingKey === defaultParam.key;
              const currentValue = param?.value ?? defaultParam.defaultValue;
              const isDefault = currentValue === defaultParam.defaultValue;
              const isBoolean = defaultParam.valueType === "boolean";

              return (
                <Card key={defaultParam.key} className="border">
                  <CardContent className="pt-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{defaultParam.name}</Label>
                          {isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Padrão
                            </Badge>
                          )}
                          {selectedContractType !== "all" && (
                            <Badge variant="outline" className="text-xs">
                              {contractTypes.find((t) => t.value === selectedContractType)?.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {defaultParam.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isBoolean ? (
                          <>
                            <Switch
                              checked={currentValue === "true"}
                              onCheckedChange={(checked) =>
                                handleToggle(defaultParam.key, checked)
                              }
                              disabled={isUpdating || isCreating}
                            />
                            {!isDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReset(defaultParam.key)}
                                title="Restaurar padrão"
                              >
                                <RefreshCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        ) : isEditing ? (
                          <>
                            {defaultParam.valueType === "string" ? (
                              <NativeSelect
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-32"
                              >
                                <NativeSelectOption value="daily">Diário</NativeSelectOption>
                                <NativeSelectOption value="weekly">Semanal</NativeSelectOption>
                                <NativeSelectOption value="monthly">Mensal</NativeSelectOption>
                              </NativeSelect>
                            ) : (
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24"
                                min={"minValue" in defaultParam ? defaultParam.minValue : undefined}
                                max={"maxValue" in defaultParam ? defaultParam.maxValue : undefined}
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSave(defaultParam.key)}
                              disabled={isUpdating || isCreating}
                            >
                              {isUpdating || isCreating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingKey(null)}
                            >
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-semibold">
                              {formatParameterValue(currentValue, defaultParam.valueType)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(defaultParam.key)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            {!isDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReset(defaultParam.key)}
                                title="Restaurar padrão"
                              >
                                <RefreshCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
