import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";

import { useDailyScheduling } from "./daily-scheduling-provider";

export function DailySchedulingPrimaryButtons() {
  const { setOpen } = useDailyScheduling();

  return (
    <div className="flex gap-2">
      <Button onClick={() => setOpen("create")}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Programação
      </Button>
    </div>
  );
}
