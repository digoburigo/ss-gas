import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ConfigDrawer } from "~/components/config-drawer";
import FormCardSkeleton from "~/components/form-card-skeleton";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import ProductViewPage from "~/features/products/components/product-view-page";

export const Route = createFileRoute("/_authenticated/products/$productId")({
  component: RouteComponent,
});

export default function RouteComponent() {
  const params = Route.useParams();

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <Suspense fallback={<FormCardSkeleton />}>
          <ProductViewPage productId={params.productId} />
        </Suspense>
      </Main>
    </>
  );
}
