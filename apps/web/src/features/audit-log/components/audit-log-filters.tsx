import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { Input } from "@acme/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { cn } from "@acme/ui";

import { entityTypes, actionTypes } from "../data/data";
import { useAuditLog } from "./audit-log-provider";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuditLogFiltersProps = {
  users: User[];
};

export function AuditLogFilters({ users }: AuditLogFiltersProps) {
  const {
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
  } = useAuditLog();

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({ start, end });
  };

  const hasActiveFilters =
    selectedEntityType ||
    selectedAction ||
    selectedUserId ||
    searchQuery.length > 0;

  const clearFilters = () => {
    setSelectedEntityType(null);
    setSelectedAction(null);
    setSelectedUserId(null);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Buscar por nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[200px] pl-9"
        />
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.start ? (
                dateRange.end ? (
                  <>
                    {format(dateRange.start, "dd/MM/yy", { locale: ptBR })} -{" "}
                    {format(dateRange.end, "dd/MM/yy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.start, "dd/MM/yy", { locale: ptBR })
                )
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.start}
              selected={{
                from: dateRange.start,
                to: dateRange.end,
              }}
              onSelect={(range) => {
                if (range?.from) {
                  setDateRange({
                    start: range.from,
                    end: range.to ?? range.from,
                  });
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Quick range buttons */}
        <div className="hidden items-center gap-1 sm:flex">
          <Button variant="ghost" size="sm" onClick={() => handleQuickRange(7)}>
            7D
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickRange(30)}
          >
            30D
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickRange(90)}
          >
            90D
          </Button>
        </div>
      </div>

      {/* Entity Type Filter */}
      <Select
        value={selectedEntityType ?? "all"}
        onValueChange={(value) =>
          setSelectedEntityType(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tipo de entidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas entidades</SelectItem>
          {entityTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center gap-2">
                <type.icon className="h-4 w-4" />
                {type.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Action Filter */}
      <Select
        value={selectedAction ?? "all"}
        onValueChange={(value) =>
          setSelectedAction(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Ação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas ações</SelectItem>
          {actionTypes.map((action) => (
            <SelectItem key={action.value} value={action.value}>
              <div className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* User Filter */}
      <Select
        value={selectedUserId ?? "all"}
        onValueChange={(value) =>
          setSelectedUserId(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Usuário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos usuários</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
