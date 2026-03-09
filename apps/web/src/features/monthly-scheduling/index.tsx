import { useState } from "react";
import { CalendarRange, Upload } from "lucide-react";

import { Button } from "@acme/ui/button";

import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { MonthlySchedulingUploadDrawer } from "./components/monthly-scheduling-upload-drawer";

export function MonthlyScheduling() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
          <ConfigDrawer />
        </div>
      </Header>
      <Main>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <CalendarRange className="h-6 w-6" />
              Programacao Mensal
            </h2>
            <p className="text-muted-foreground">
              Gerencie as programacoes mensais de gas.
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Planilha
          </Button>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">
            Use o botao "Upload Planilha" para importar programacoes a partir de
            uma planilha Excel.
          </p>
        </div>
      </Main>

      <MonthlySchedulingUploadDrawer
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </>
  );
}
