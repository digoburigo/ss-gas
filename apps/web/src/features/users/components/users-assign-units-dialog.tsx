import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Check } from "lucide-react";
import { toast } from "sonner";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { ScrollArea } from "@acme/ui/scroll-area";
import { schema } from "@acme/zen-v3/zenstack/schema";

import type { Member } from "../data/schema";

type UsersAssignUnitsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
};

export function UsersAssignUnitsDialog({
  open,
  onOpenChange,
  member,
}: UsersAssignUnitsDialogProps) {
  const queryClient = useQueryClient();
  const client = useClientQueries(schema);

  // Get all active units in the organization
  const { data: units = [] } = client.gasUnit.useFindMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  // Get current assignments for this member
  const { data: currentAssignments = [] } = client.gasUnitOperator.useFindMany({
    where: { memberId: member.id },
  });

  const createAssignment = client.gasUnitOperator.useCreate();
  const deleteAssignment = client.gasUnitOperator.useDelete();

  // Track selected units
  const currentUnitIds = useMemo(
    () => new Set(currentAssignments.map((a) => a.unitId)),
    [currentAssignments],
  );
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(
    () => new Set(currentUnitIds),
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset selection when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedUnits(new Set(currentUnitIds));
    }
    onOpenChange(newOpen);
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find units to add and remove
      const toAdd = [...selectedUnits].filter((id) => !currentUnitIds.has(id));
      const toRemove = [...currentUnitIds].filter(
        (id) => !selectedUnits.has(id),
      );

      // Remove assignments
      for (const unitId of toRemove) {
        const assignment = currentAssignments.find((a) => a.unitId === unitId);
        if (assignment) {
          await deleteAssignment.mutateAsync({ where: { id: assignment.id } });
        }
      }

      // Add new assignments
      for (const unitId of toAdd) {
        await createAssignment.mutateAsync({
          data: {
            memberId: member.id,
            unitId,
          },
        });
      }

      await queryClient.invalidateQueries();

      toast.success("Unidades atualizadas", {
        description: `As unidades de ${member.user.name} foram atualizadas.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao atualizar unidades", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao atualizar as unidades.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Atribuir Unidades
          </DialogTitle>
          <DialogDescription>
            Selecione as unidades consumidoras que {member.user.name} pode
            gerenciar como operador.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-2">
            {units.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma unidade consumidora cadastrada.
              </p>
            ) : (
              units.map((unit) => {
                const isSelected = selectedUnits.has(unit.id);
                return (
                  <div
                    key={unit.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => toggleUnit(unit.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleUnit(unit.id);
                      }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUnit(unit.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{unit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Código: {unit.code}
                        {unit.city && ` • ${unit.city}`}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          {selectedUnits.size} unidade(s) selecionada(s)
        </div>

        <DialogFooter className="gap-y-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
