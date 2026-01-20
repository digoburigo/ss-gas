import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import type { Organization } from "@acme/zen-v3/zenstack/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { OrganizationForm } from "./organization-form";

type OrganizationsMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Organization;
};

export function OrganizationsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: OrganizationsMutateDrawerProps) {
  const isUpdate = !!currentRow;
  const client = useClientQueries(schema);

  const { mutate: createOrganization, isPending: isCreating } =
    client.organization.useCreate({
      onSuccess: () => {
        toast.success("Organização criada com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: updateOrganization, isPending: isUpdating } =
    client.organization.useUpdate({
      onSuccess: () => {
        toast.success("Organização atualizada com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleSubmit = async (data: {
    name: string;
    cnpj: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    active: boolean;
  }) => {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (isUpdate && currentRow) {
      updateOrganization({
        data: {
          name: data.name,
          slug,
          cnpj: data.cnpj || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          active: data.active,
        },
        where: { id: currentRow.id },
      });
    } else {
      createOrganization({
        data: {
          name: data.name,
          slug,
          cnpj: data.cnpj || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          active: data.active,
        },
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader className="text-start">
          <SheetTitle>{isUpdate ? "Editar" : "Criar"} Organização</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Atualize as informações da organização."
              : "Adicione uma nova organização preenchendo as informações abaixo."}{" "}
            Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <OrganizationForm
            defaultValues={
              currentRow
                ? {
                    name: currentRow.name,
                    cnpj: currentRow.cnpj ?? "",
                    address: currentRow.address ?? "",
                    city: currentRow.city ?? "",
                    state: currentRow.state ?? "",
                    zipCode: currentRow.zipCode ?? "",
                    contactName: currentRow.contactName ?? "",
                    contactEmail: currentRow.contactEmail ?? "",
                    contactPhone: currentRow.contactPhone ?? "",
                    active: currentRow.active,
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
