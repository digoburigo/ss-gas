import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

import { useActualConsumption } from "./actual-consumption-provider";

export function ActualConsumptionPrimaryButtons() {
  const { setOpen } = useActualConsumption();

  return (
    <div className="flex gap-2">
      <Button onClick={() => setOpen("create")}>
        <Plus className="mr-2 h-4 w-4" />
        Registrar Consumo
      </Button>
    </div>
  );
}
