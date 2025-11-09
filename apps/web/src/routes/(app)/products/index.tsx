import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Product } from "@acme/zen-v3/zenstack/models";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Button } from "@acme/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@acme/ui/empty";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { ProductsTable } from "~/components/products/products-table";

export const Route = createFileRoute("/(app)/products/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: activeOrganization, isPending: isLoadingActiveOrganization } =
    authClient.useActiveOrganization();

  const client = useClientQueries(schema);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: products, isFetching: isFetchingProducts } =
    client.product.useFindMany(
      {},
      {
        enabled: !!activeOrganization?.id,
      },
    );

  const { data: session } = authClient.useSession();
  const { mutateAsync: deleteProduct } = client.product.useUpdate({
    onSuccess: () => {
      toast.success("Produto excluído com sucesso");
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    await deleteProduct({
      data: {
        deletedAt: new Date(),
        deletedById: session?.user?.id,
      },
      where: { id: productToDelete.id },
    });
  };

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos e estoque.
          </p>
        </div>
        <Button asChild>
          <Link to="/products/new">
            <Plus className="mr-2 size-4" />
            Criar Produto
          </Link>
        </Button>
      </div>

      {isLoadingActiveOrganization ? <p>Carregando organização...</p> : null}
      {!isLoadingActiveOrganization && !activeOrganization ? (
        <p>Por favor, selecione uma organização para visualizar produtos.</p>
      ) : null}

      {activeOrganization && (
        <>
          {isFetchingProducts ? <p>Carregando produtos...</p> : null}
          {!isFetchingProducts && products && products.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <div className="bg-muted flex size-16 items-center justify-center rounded-full">
                  <svg
                    className="text-muted-foreground size-8"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20 7h-4m-2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
                    <rect height="12" rx="2" width="12" x="4" y="5" />
                  </svg>
                </div>
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Nenhum produto cadastrado</EmptyTitle>
                <EmptyDescription>
                  Comece criando seu primeiro produto para gerenciar seu
                  estoque.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link to="/products/new">
                    <Plus className="mr-2 size-4" />
                    Criar Produto
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : null}
          {!isFetchingProducts && products && products.length > 0 ? (
            <ProductsTable products={products} onDelete={handleDelete} />
          ) : null}
        </>
      )}

      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.name}
              "? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

