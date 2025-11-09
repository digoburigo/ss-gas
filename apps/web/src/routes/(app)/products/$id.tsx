import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { ProductForm } from "~/components/products/product-form";

export const Route = createFileRoute("/(app)/products/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/(app)/products/$id" });
  const navigate = useNavigate();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const client = useClientQueries(schema);

  const { data: product, isFetching } = client.product.useFindUnique(
    {
      where: { id },
    },
    {
      enabled: !!activeOrganization?.id && !!id,
    },
  );

  const { mutate: updateProduct, isPending } = client.product.useUpdate({
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso");
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
    if (!product) return;

    updateProduct({
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
      where: { id: product.id },
    });
  };

  if (isFetching) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p>Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Produto não encontrado</h2>
          <p className="text-muted-foreground mt-2">
            O produto que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Produto</h1>
        <p className="text-muted-foreground">
          Atualize os dados do produto abaixo.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ProductForm
          defaultValues={{
            code: product.code,
            name: product.name,
            category: product.category ?? "",
            unit: product.unit ?? "",
            costPrice: product.costPrice?.toString() ?? "",
            salePrice: product.salePrice?.toString() ?? "",
            minimumStock: product.minimumStock?.toString() ?? "",
            storageLocation: product.storageLocation ?? "",
            active: product.active,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
        />
      </div>
    </div>
  );
}

