import { MailPlus } from "lucide-react";

import { Button } from "@acme/ui/button";

import { useUsers } from "./users-provider";

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("invite")}>
        <span>Convidar Usuário</span> <MailPlus size={18} />
      </Button>
    </div>
  );
}
