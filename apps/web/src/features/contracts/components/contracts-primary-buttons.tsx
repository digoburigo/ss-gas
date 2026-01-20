import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

import { useContracts } from "./contracts-provider";

export function ContractsPrimaryButtons() {
  const { setOpen } = useContracts();

  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("create")}>
        <span>Criar Contrato</span> <Plus size={18} />
      </Button>
    </div>
  );
}
