import { Separator } from "@acme/ui/separator";
import { SidebarTrigger } from "@acme/ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex flex-1 items-center justify-between gap-4">
        {/* Add breadcrumbs or page title here if needed */}
      </div>
    </header>
  );
}
