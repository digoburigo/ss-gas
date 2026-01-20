import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

import { useConsumerUnits } from "./consumer-units-provider";

export function ConsumerUnitsPrimaryButtons() {
  const { setOpen } = useConsumerUnits();

  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("create")}>
        <span>Criar</span> <Plus size={18} />
      </Button>
    </div>
  );
}
