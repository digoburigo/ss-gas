"use no memo";

import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { authClient } from "~/clients/auth-client";
import { useSchedulingDashboard } from "./scheduling-dashboard-provider";

export function SchedulingDashboardDatePicker() {
  const { selectedDate, setSelectedDate } = useSchedulingDashboard();
  const { data: session } = authClient.useSession();
  const client = useClientQueries(schema);

  const { data: member } = client.member.useFindFirst(
    {
      where: { userId: session?.user?.id },
      select: { profile: true, role: true },
    },
    { enabled: !!session?.user?.id },
  );

  const isAdmin =
    member?.profile === "admin" ||
    member?.role === "admin" ||
    member?.role === "owner";

  const today = startOfDay(new Date());

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    if (!isAdmin && startOfDay(prev) < today) {
      return;
    }
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const isPreviousDisabled = !isAdmin && startOfDay(selectedDate) <= today;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousDay}
        disabled={isPreviousDisabled}
        title="Dia anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            initialFocus
            locale={ptBR}
            {...(!isAdmin && {
              disabled: { before: today },
              startMonth: today,
            })}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={goToNextDay}
        title="Próximo dia"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <Button variant="ghost" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      )}
    </div>
  );
}
