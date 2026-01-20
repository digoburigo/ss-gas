import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import { schema } from "@acme/zen-v3/zenstack/schema";

import { ConfirmDialog } from "~/components/confirm-dialog";
import { OrganizationsMutateDrawer } from "./organizations-mutate-drawer";
import { useOrganizations } from "./organizations-provider";

export function OrganizationsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useOrganizations();
  const client = useClientQueries(schema);

  const { mutateAsync: updateOrganization } = client.organization.useUpdate({
    onSuccess: () => {
      toast.success("Organização atualizada com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutateAsync: deleteOrganization } = client.organization.useDelete({
    onSuccess: () => {
      toast.success("Organização excluída com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggleActive = async () => {
    if (!currentRow) return;

    await updateOrganization({
      data: {
        active: !currentRow.active,
      },
      where: { id: currentRow.id },
    });

    setOpen(null);
    setTimeout(() => {
      setCurrentRow(null);
    }, 500);
  };

  const handleDelete = async () => {
    if (!currentRow) return;

    await deleteOrganization({
      where: { id: currentRow.id },
    });

    setOpen(null);
    setTimeout(() => {
      setCurrentRow(null);
    }, 500);
  };

  return (
    <>
      <OrganizationsMutateDrawer
        key="organization-create"
        open={open === "create"}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      />

      {currentRow && (
        <>
          <OrganizationsMutateDrawer
            key={`organization-update-${currentRow.id}`}
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
            key="organization-toggle-active"
            open={open === "toggle-active"}
            onOpenChange={(v) => {
              if (!v) {
                setOpen(null);
                setTimeout(() => {
                  setCurrentRow(null);
                }, 500);
              }
            }}
            handleConfirm={handleToggleActive}
            className="max-w-md"
            title={`${currentRow.active ? "Desativar" : "Ativar"} organização: ${currentRow.name}?`}
            desc={
              currentRow.active ? (
                <>
                  Você está prestes a desativar a organização{" "}
                  <strong>{currentRow.name}</strong>. <br />
                  Os usuários desta organização não poderão acessar o sistema
                  enquanto ela estiver inativa.
                </>
              ) : (
                <>
                  Você está prestes a ativar a organização{" "}
                  <strong>{currentRow.name}</strong>. <br />
                  Os usuários desta organização poderão acessar o sistema
                  novamente.
                </>
              )
            }
            confirmText={currentRow.active ? "Desativar" : "Ativar"}
          />

          <ConfirmDialog
            key="organization-delete"
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
            title={`Excluir organização: ${currentRow.name}?`}
            desc={
              <>
                Você está prestes a excluir a organização{" "}
                <strong>{currentRow.name}</strong>. <br />
                <strong className="text-destructive">
                  Esta ação é irreversível e removerá todos os dados associados.
                </strong>
              </>
            }
            confirmText="Excluir"
          />
        </>
      )}
    </>
  );
}
