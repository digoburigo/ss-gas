import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { ClientsMutateDrawer } from "./clients-mutate-drawer";
import { useClients } from "./clients-provider";

export function ClientsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useClients();
  const client = useClientQueries(schema);
  const { data: session } = authClient.useSession();

  const { mutateAsync: deleteClient } = client.client.useUpdate({
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = async () => {
    if (!currentRow || !session?.user?.id) return;

    await deleteClient({
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      },
      where: { id: currentRow.id },
    });

    setOpen(null);
    setTimeout(() => {
      setCurrentRow(null);
    }, 500);
  };

  return (
    <>
      <ClientsMutateDrawer
        key="client-create"
        open={open === "create"}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      />

      {currentRow && (
        <>
          <ClientsMutateDrawer
            key={`client-update-${currentRow.id}`}
            open={open === "update"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key="client-delete"
            destructive
            open={open === "delete"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
            handleConfirm={handleDelete}
            className="max-w-md"
            title={`Excluir cliente: ${currentRow.name}?`}
            desc={
              <>
                Você está prestes a excluir o cliente{" "}
                <strong>{currentRow.name}</strong> (email:{" "}
                <strong>{currentRow.email}</strong>). <br />
                Esta ação não pode ser desfeita.
              </>
            }
            confirmText="Excluir"
          />
        </>
      )}
    </>
  );
}
