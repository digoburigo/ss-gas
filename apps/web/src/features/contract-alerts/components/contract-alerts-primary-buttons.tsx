import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

import { useContractAlerts } from "./contract-alerts-provider";

export function ContractAlertsPrimaryButtons() {
  const { setOpen } = useContractAlerts();

  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("create")}>
        <span>Novo Alerta</span> <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
