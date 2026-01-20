import { useState } from "react";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { AlertTriangle, Calculator, Check, Code, Loader2, RefreshCcw, Save } from "lucide-react";
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
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import { schema } from "@acme/zen-v3/zenstack/schema";

import {
  defaultPenaltyFormulas,
  formatParameterValue,
} from "../data/data";

export function PenaltyFormulasTab() {
  const client = useClientQueries(schema);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Fetch existing parameters
  const { data: parameters = [], isLoading, refetch } = client.gasSystemParameter.useFindMany({
    where: { category: "penalty_formulas", active: true },
    orderBy: { orderIndex: "asc" },
  });

  // Create mutation
  const { mutate: createParameter, mutateAsync: createParameterAsync, isPending: isCreating } =
    client.gasSystemParameter.useCreate({
      onSuccess: () => {
        toast.success("Fórmula criada com sucesso");
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao criar fórmula: ${error.message}`);
      },
    });

  // Update mutation
  const { mutate: updateParameter, isPending: isUpdating } =
    client.gasSystemParameter.useUpdate({
      onSuccess: () => {
        toast.success("Fórmula atualizada com sucesso");
        setEditingKey(null);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Erro ao atualizar fórmula: ${error.message}`);
      },
    });

  // Initialize default parameters if none exist
  const handleInitializeDefaults = async () => {
    for (const param of defaultPenaltyFormulas) {
      const exists = (parameters as GasSystemParameter[]).some((p) => p.key === param.key);
      if (!exists) {
        await createParameterAsync({
          data: {
            category: "penalty_formulas",
            key: param.key,
            name: param.name,
            description: param.description,
            value: param.defaultValue,
            valueType: param.valueType,
            defaultValue: param.defaultValue,
            minValue: "minValue" in param ? param.minValue : undefined,
            maxValue: "maxValue" in param ? param.maxValue : undefined,
            orderIndex: defaultPenaltyFormulas.indexOf(param),
          },
        });
      }
    }
  };

  // Get value for a parameter, using default if not found
  const getParameterValue = (key: string): string => {
    const param = (parameters as GasSystemParameter[]).find((p) => p.key === key);
    if (param) return param.value;
    const defaultParam = defaultPenaltyFormulas.find((p) => p.key === key);
    return defaultParam?.defaultValue ?? "";
  };

  // Handle starting edit
  const handleEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(getParameterValue(key));
  };

  // Handle save
  const handleSave = (key: string) => {
    const param = (parameters as GasSystemParameter[]).find((p) => p.key === key);
    if (param) {
      updateParameter({
        where: { id: param.id },
        data: { value: editValue },
      });
    } else {
      const defaultParam = defaultPenaltyFormulas.find((p) => p.key === key);
      if (defaultParam) {
        createParameter({
          data: {
            category: "penalty_formulas",
            key: defaultParam.key,
            name: defaultParam.name,
            description: defaultParam.description,
            value: editValue,
            valueType: defaultParam.valueType,
            defaultValue: defaultParam.defaultValue,
            minValue: "minValue" in defaultParam ? defaultParam.minValue : undefined,
            maxValue: "maxValue" in defaultParam ? defaultParam.maxValue : undefined,
            orderIndex: defaultPenaltyFormulas.indexOf(defaultParam),
          },
        });
      }
    }
  };

  // Handle reset to default
  const handleReset = (key: string) => {
    const param = (parameters as GasSystemParameter[]).find((p) => p.key === key);
    const defaultParam = defaultPenaltyFormulas.find((p) => p.key === key);
    if (param && defaultParam) {
      updateParameter({
        where: { id: param.id },
        data: { value: defaultParam.defaultValue },
      });
    }
  };

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
            <Calculator className="h-5 w-5 text-orange-500" />
            <CardTitle>Fórmulas de Penalidade</CardTitle>
          </div>
          {parameters.length === 0 && (
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
          Configure as fórmulas de cálculo de multas, penalidades e juros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {defaultPenaltyFormulas.map((defaultParam) => {
          const param = (parameters as GasSystemParameter[]).find((p) => p.key === defaultParam.key);
          const isEditing = editingKey === defaultParam.key;
          const currentValue = param?.value ?? defaultParam.defaultValue;
          const isDefault = currentValue === defaultParam.defaultValue;
          const isFormula = defaultParam.valueType === "formula";

          return (
            <Card key={defaultParam.key} className="border">
              <CardContent className="pt-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{defaultParam.name}</Label>
                        {isFormula && (
                          <Badge variant="outline" className="text-xs">
                            <Code className="mr-1 h-3 w-3" />
                            Fórmula
                          </Badge>
                        )}
                        {isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {defaultParam.description}
                      </p>
                    </div>
                    {!isEditing && !isFormula && (
                      <div className="flex items-center gap-2">
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
                      </div>
                    )}
                  </div>

                  {isFormula && !isEditing && (
                    <div className="flex items-center justify-between">
                      <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
                        {currentValue}
                      </code>
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex items-center gap-2">
                      {isFormula ? (
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="font-mono text-sm"
                          rows={2}
                          placeholder="Ex: (deviation * base_price * 1.5)"
                        />
                      ) : (
                        <>
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24"
                            min={"minValue" in defaultParam ? defaultParam.minValue : undefined}
                            max={"maxValue" in defaultParam ? defaultParam.maxValue : undefined}
                          />
                          {defaultParam.valueType === "percentage" && (
                            <span className="text-muted-foreground">%</span>
                          )}
                        </>
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
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
