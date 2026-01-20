import { useQueryClient } from "@tanstack/react-query";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { Power } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { schema } from "@acme/zen-v3/zenstack/schema";

import type { Member } from "../data/schema";

type UsersReactivateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
};

export function UsersReactivateDialog({
  open,
  onOpenChange,
  member,
}: UsersReactivateDialogProps) {
  const queryClient = useQueryClient();
  const client = useClientQueries(schema);
  const updateMember = client.member.useUpdate();

  const handleReactivate = async () => {
    try {
      // Update ZenStack member to remove deactivatedAt
      await updateMember.mutateAsync({
        where: { id: member.id },
        data: {
          deactivatedAt: null,
          deactivatedById: null,
        },
      });

      await queryClient.invalidateQueries();

      toast.success("Usuário reativado", {
        description: `${member.user.name} foi reativado e pode acessar o sistema novamente.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao reativar usuário", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao reativar o usuário.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Reativar Usuário
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja reativar <strong>{member.user.name}</strong>?
            <br />
            <br />O usuário poderá acessar o sistema novamente com as mesmas
            permissões que tinha antes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-y-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleReactivate} disabled={updateMember.isPending}>
            {updateMember.isPending ? "Reativando..." : "Reativar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
