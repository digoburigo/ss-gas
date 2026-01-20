import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

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
import { authClient } from "~/clients/auth-client";

type UsersDeactivateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
};

export function UsersDeactivateDialog({
  open,
  onOpenChange,
  member,
}: UsersDeactivateDialogProps) {
  const queryClient = useQueryClient();
  const client = useClientQueries(schema);
  const updateMember = client.member.useUpdate();
  const { data: session } = authClient.useSession();

  const handleDeactivate = async () => {
    try {
      // Update ZenStack member with deactivatedAt
      await updateMember.mutateAsync({
        where: { id: member.id },
        data: {
          deactivatedAt: new Date(),
          deactivatedById: session?.user?.id,
        },
      });

      await queryClient.invalidateQueries();

      toast.success("Usuário desativado", {
        description: `${member.user.name} foi desativado e não pode mais acessar o sistema.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao desativar usuário", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao desativar o usuário.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Desativar Usuário
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja desativar <strong>{member.user.name}</strong>?
            <br />
            <br />O usuário perderá o acesso ao sistema mas poderá ser reativado
            posteriormente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-y-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={updateMember.isPending}
          >
            {updateMember.isPending ? "Desativando..." : "Desativar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
