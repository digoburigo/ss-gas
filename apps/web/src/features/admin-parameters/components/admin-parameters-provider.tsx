import { createContext, useCallback, useContext, useState } from "react";

type ParameterCategory =
  | "alert_thresholds"
  | "penalty_formulas"
  | "business_rules"
  | "contract_templates"
  | "custom_fields";

interface AdminParametersContextValue {
  activeTab: ParameterCategory;
  setActiveTab: (tab: ParameterCategory) => void;
  editingParameterId: string | null;
  setEditingParameterId: (id: string | null) => void;
  editingTemplateId: string | null;
  setEditingTemplateId: (id: string | null) => void;
  editingFieldId: string | null;
  setEditingFieldId: (id: string | null) => void;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
  selectedContractType: string | null;
  setSelectedContractType: (type: string | null) => void;
}

const AdminParametersContext = createContext<AdminParametersContextValue | null>(null);

export function AdminParametersProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ParameterCategory>("alert_thresholds");
  const [editingParameterId, setEditingParameterId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);

  return (
    <AdminParametersContext.Provider
      value={{
        activeTab,
        setActiveTab,
        editingParameterId,
        setEditingParameterId,
        editingTemplateId,
        setEditingTemplateId,
        editingFieldId,
        setEditingFieldId,
        isCreateDialogOpen,
        setIsCreateDialogOpen,
        selectedContractType,
        setSelectedContractType,
      }}
    >
      {children}
    </AdminParametersContext.Provider>
  );
}

export function useAdminParameters() {
  const context = useContext(AdminParametersContext);
  if (!context) {
    throw new Error("useAdminParameters must be used within AdminParametersProvider");
  }
  return context;
}
