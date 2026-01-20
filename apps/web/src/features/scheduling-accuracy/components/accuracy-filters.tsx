import { CalendarDays } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { Label } from "@acme/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { periodOptions } from "../data/data";
import { useSchedulingAccuracy } from "./scheduling-accuracy-provider";

type AccuracyFiltersProps = {
  units: Array<{ id: string; name: string; code: string }>;
};

export function AccuracyFilters({ units }: AccuracyFiltersProps) {
  const {
    period,
    setPeriod,
    selectedUnitId,
    setSelectedUnitId,
    dateRange,
    setDateRange,
  } = useSchedulingAccuracy();

  const formatDateRange = () => {
    const start = dateRange.start.toLocaleDateString("pt-BR");
    const end = dateRange.end.toLocaleDateString("pt-BR");
    return `${start} - ${end}`;
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Period selector */}
      <div className="grid gap-2">
        <Label htmlFor="period">Período</Label>
        <Select
          value={period}
          onValueChange={(value) =>
            setPeriod(value as "daily" | "weekly" | "monthly")
          }
        >
          <SelectTrigger id="period" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Unit selector */}
      <div className="grid gap-2">
        <Label htmlFor="unit">Unidade</Label>
        <Select
          value={selectedUnitId || "all"}
          onValueChange={(value) =>
            setSelectedUnitId(value === "all" ? null : value)
          }
        >
          <SelectTrigger id="unit" className="w-[200px]">
            <SelectValue placeholder="Todas as unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name} ({unit.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range picker */}
      <div className="grid gap-2">
        <Label>Intervalo de Datas</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[280px] justify-start text-left font-normal"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.start,
                to: dateRange.end,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ start: range.from, end: range.to });
                } else if (range?.from) {
                  setDateRange({ start: range.from, end: range.from });
                }
              }}
              numberOfMonths={2}
              locale={{
                localize: {
                  day: (day: number) =>
                    (["D", "S", "T", "Q", "Q", "S", "S"] as const)[day] ?? "D",
                  month: (month: number) =>
                    ([
                      "Janeiro",
                      "Fevereiro",
                      "Março",
                      "Abril",
                      "Maio",
                      "Junho",
                      "Julho",
                      "Agosto",
                      "Setembro",
                      "Outubro",
                      "Novembro",
                      "Dezembro",
                    ] as const)[month] ?? "Janeiro",
                  ordinalNumber: (n: number) => `${n}`,
                  era: (era: number) => (era === 0 ? "AC" : "DC"),
                  quarter: (q: number) => `T${q}`,
                  dayPeriod: (dayPeriod: string) =>
                    dayPeriod === "am" ? "manhã" : "tarde",
                },
                formatLong: {
                  date: () => "dd/MM/yyyy",
                  time: () => "HH:mm",
                  dateTime: () => "dd/MM/yyyy HH:mm",
                },
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick preset buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setDateRange({ start, end });
          }}
        >
          Este mês
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            setDateRange({ start, end });
          }}
        >
          Mês anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setDateRange({ start, end });
          }}
        >
          Últimos 3 meses
        </Button>
      </div>
    </div>
  );
}
