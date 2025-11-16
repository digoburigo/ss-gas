import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import type { Client } from "@acme/zen-v3/zenstack/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { ClientForm } from "~/components/clients/client-form";

type ClientsMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Client;
};

export function ClientsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ClientsMutateDrawerProps) {
  const isUpdate = !!currentRow;
  const client = useClientQueries(schema);
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const { mutate: createClient, isPending: isCreating } =
    client.client.useCreate({
      onSuccess: () => {
        toast.success("Cliente criado com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: updateClient, isPending: isUpdating } =
    client.client.useUpdate({
      onSuccess: () => {
        toast.success("Cliente atualizado com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleSubmit = async (data: {
    name: string;
    email: string;
    phone: string;
    status: "active" | "inactive";
  }) => {
    if (!activeOrganization?.id) {
      toast.error("Por favor, selecione uma organização");
      return;
    }

    if (isUpdate && currentRow) {
      updateClient({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status,
        },
        where: { id: currentRow.id },
      });
    } else {
      createClient({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status,
        },
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-start">
          <SheetTitle>{isUpdate ? "Editar" : "Criar"} Cliente</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Atualize as informações do cliente."
              : "Adicione um novo cliente preenchendo as informações abaixo."}
            Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ClientForm
            defaultValues={
              currentRow
                ? {
                    name: currentRow.name,
                    email: currentRow.email,
                    phone: currentRow.phone,
                    status: currentRow.status,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={isCreating || isUpdating}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
