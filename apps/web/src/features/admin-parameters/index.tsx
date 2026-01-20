import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@acme/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

import {
  AdminParametersProvider,
  useAdminParameters,
} from "./components/admin-parameters-provider";
import { AlertThresholdsTab } from "./components/alert-thresholds-tab";
import { BusinessRulesTab } from "./components/business-rules-tab";
import { ContractTemplatesTab } from "./components/contract-templates-tab";
import { CustomFieldsTab } from "./components/custom-fields-tab";
import { PenaltyFormulasTab } from "./components/penalty-formulas-tab";
import { parameterCategories } from "./data/data";

function AdminParametersContent() {
  const { activeTab, setActiveTab } = useAdminParameters();

  return (
    <>
      <Header fixed>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/gas">Gás</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Parâmetros Administrativos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <ShieldAlert className="text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Parâmetros Administrativos
              </h2>
              <p className="text-muted-foreground">
                Configure parâmetros do sistema, regras de negócio e personalizações.
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as typeof activeTab)
          }
          className="space-y-4"
        >
          <TabsList className="flex-wrap">
            {parameterCategories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.value}
                  value={category.value}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="alert_thresholds">
            <AlertThresholdsTab />
          </TabsContent>

          <TabsContent value="penalty_formulas">
            <PenaltyFormulasTab />
          </TabsContent>

          <TabsContent value="business_rules">
            <BusinessRulesTab />
          </TabsContent>

          <TabsContent value="contract_templates">
            <ContractTemplatesTab />
          </TabsContent>

          <TabsContent value="custom_fields">
            <CustomFieldsTab />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}

export function AdminParameters() {
  return (
    <AdminParametersProvider>
      <AdminParametersContent />
    </AdminParametersProvider>
  );
}
