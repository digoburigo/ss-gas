import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type DialogType = "details" | "export" | null;

interface AuditLogContextType {
  // Date range filter
  dateRange: { start: Date; end: Date };
  setDateRange: (range: { start: Date; end: Date }) => void;

  // Entity type filter
  selectedEntityType: string | null;
  setSelectedEntityType: (type: string | null) => void;

  // Action filter
  selectedAction: string | null;
  setSelectedAction: (action: string | null) => void;

  // User filter
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;

  // Search query (for entity name or field)
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Dialog state
  open: DialogType;
  setOpen: (type: DialogType) => void;

  // Selected log for details
  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;
}

const AuditLogContext = createContext<AuditLogContextType | null>(null);

export function useAuditLog() {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error("useAuditLog must be used within an AuditLogProvider");
  }
  return context;
}

interface AuditLogProviderProps {
  children: ReactNode;
}

export function AuditLogProvider({ children }: AuditLogProviderProps) {
  // Default date range: last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [dateRange, setDateRange] = useState({
    start: thirtyDaysAgo,
    end: today,
  });
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(
    null,
  );
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState<DialogType>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <AuditLogContext.Provider
      value={{
        dateRange,
        setDateRange,
        selectedEntityType,
        setSelectedEntityType,
        selectedAction,
        setSelectedAction,
        selectedUserId,
        setSelectedUserId,
        searchQuery,
        setSearchQuery,
        open,
        setOpen,
        selectedLogId,
        setSelectedLogId,
      }}
    >
      {children}
    </AuditLogContext.Provider>
  );
}
