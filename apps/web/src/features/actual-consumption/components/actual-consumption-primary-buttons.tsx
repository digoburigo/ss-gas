import { useState } from "react";
import { Plus, Upload } from "lucide-react";

import { Button } from "@acme/ui/button";

import { ActualConsumptionImportDrawer } from "./actual-consumption-import-drawer";
import { useActualConsumption } from "./actual-consumption-provider";

export function ActualConsumptionPrimaryButtons() {
  const { setOpen } = useActualConsumption();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setImportOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Importar Consumos
      </Button>
      <Button onClick={() => setOpen("create")}>
        <Plus className="mr-2 h-4 w-4" />
        Registrar Consumo
      </Button>
      <ActualConsumptionImportDrawer
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
