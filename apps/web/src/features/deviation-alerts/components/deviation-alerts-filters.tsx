import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { cn } from "@acme/ui";

import { useDeviationAlerts } from "./deviation-alerts-provider";

type Unit = {
  id: string;
  name: string;
  code: string;
};

type DeviationAlertsFiltersProps = {
  units: Unit[];
};

export function DeviationAlertsFilters({ units }: DeviationAlertsFiltersProps) {
  const {
    dateRange,
    setDateRange,
    selectedUnitId,
    setSelectedUnitId,
    statusFilter,
    setStatusFilter,
    thresholdPercent,
  } = useDeviationAlerts();

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({ start, end });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickRange(7)}
          >
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

      {/* Unit Filter */}
      <Select
        value={selectedUnitId ?? "all"}
        onValueChange={(value) =>
          setSelectedUnitId(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todas unidades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas unidades</SelectItem>
          {units.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="acknowledged">Reconhecidos</SelectItem>
        </SelectContent>
      </Select>

      {/* Threshold indicator */}
      <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        <span>Limiar configurado:</span>
        <span className="font-medium text-foreground">±{thresholdPercent}%</span>
      </div>

      {/* Clear Filters */}
      {(selectedUnitId || statusFilter !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedUnitId(null);
            setStatusFilter("all");
          }}
        >
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
