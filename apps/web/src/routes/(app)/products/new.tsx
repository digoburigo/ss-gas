import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { ProductForm } from "~/components/products/product-form";

export const Route = createFileRoute("/(app)/products/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const client = useClientQueries(schema);

  const { mutate: createProduct, isPending } = client.product.useCreate({
    onSuccess: () => {
      toast.success("Produto criado com sucesso");
      navigate({ to: "/products" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (data: {
    code: string;
    name: string;
    category: string;
    unit: string;
    costPrice: string;
    salePrice: string;
    minimumStock: string;
    storageLocation: string;
    active: boolean;
  }) => {
    if (!activeOrganization?.id) {
      toast.error("Por favor, selecione uma organização");
      return;
    }

    createProduct({
      data: {
        code: data.code,
        name: data.name,
        category: data.category || null,
        unit: data.unit || null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        minimumStock: data.minimumStock
          ? parseInt(data.minimumStock, 10)
          : null,
        storageLocation: data.storageLocation || null,
        active: data.active,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Criar Novo Produto
        </h1>
        <p className="text-muted-foreground">
          Preencha os dados do produto abaixo.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ProductForm onSubmit={handleSubmit} isSubmitting={isPending} />
      </div>
    </div>
  );
}

