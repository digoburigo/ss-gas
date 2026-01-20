import { useRouterState } from "@tanstack/react-router";

import { Separator } from "@acme/ui/separator";
import { SidebarTrigger } from "@acme/ui/sidebar";

const pageTitles: Record<string, string> = {
  "/": "Painel de informações",
  "/todos": "Tarefas",
  "/products": "Produtos",
  "/products/new": "Novo Produto",
};

function getPageTitle(pathname: string): string {
  // Check exact matches first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for dynamic routes (e.g., /products/$id)
  if (pathname.startsWith("/products/")) {
    return "Editar Produto";
  }

  // Default fallback
  return "Painel de informações";
}

export function SiteHeader() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const pageTitle = getPageTitle(currentPath);

  return (
    <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-3 px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>
    </header>
  );
}
