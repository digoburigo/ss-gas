import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import type {
  GasContract,
  GasContractAlert,
  GasContractAlertRecipient,
} from "@acme/zen-v3/zenstack/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@acme/ui/sheet";
import { schema } from "@acme/zen-v3/zenstack/schema";

import { ContractAlertForm } from "./contract-alert-form";

type GasContractAlertWithRelations = GasContractAlert & {
  contract?: GasContract | null;
  recipients?: GasContractAlertRecipient[];
};

type ContractAlertsMutateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: GasContractAlertWithRelations | null;
};

export function ContractAlertsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ContractAlertsMutateDrawerProps) {
  const isUpdate = !!currentRow;
  const client = useClientQueries(schema);

  const { mutate: createAlert, isPending: isCreating } =
    client.gasContractAlert.useCreate({
      onSuccess: () => {
        toast.success("Alerta criado com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: updateAlert, isPending: isUpdating } =
    client.gasContractAlert.useUpdate({
      onSuccess: () => {
        toast.success("Alerta atualizado com sucesso");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Mutations for recipients
  const { mutateAsync: createRecipient } =
    client.gasContractAlertRecipient.useCreate();
  const { mutateAsync: deleteRecipient } =
    client.gasContractAlertRecipient.useDelete();

  const handleSubmit = async (data: {
    contractId: string;
    eventType: string;
    eventName: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    recurrence: string;
    advanceNoticeDays: number[];
    recipientEmails: string[];
    active: boolean;
  }) => {
    const payload = {
      contractId: data.contractId,
      eventType: data.eventType as
        | "contract_expiration"
        | "renewal_deadline"
        | "daily_scheduling"
        | "monthly_declaration"
        | "adjustment_date"
        | "take_or_pay_expiration"
        | "make_up_gas_expiration"
        | "custom",
      eventName: data.eventName,
      eventDescription: data.eventDescription || null,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      eventTime: data.eventTime || null,
      recurrence: data.recurrence as
        | "once"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly",
      advanceNoticeDays: data.advanceNoticeDays,
      active: data.active,
    };

    if (isUpdate && currentRow) {
      updateAlert(
        {
          data: payload,
          where: { id: currentRow.id },
        },
        {
          onSuccess: async () => {
            // Update recipients
            const currentEmails =
              currentRow.recipients?.map((r) => r.email) ?? [];
            const newEmails = data.recipientEmails;

            // Remove recipients no longer in the list
            for (const recipient of currentRow.recipients ?? []) {
              if (!newEmails.includes(recipient.email)) {
                await deleteRecipient({
                  where: { id: recipient.id },
                });
              }
            }

            // Add new recipients
            for (const email of newEmails) {
              if (!currentEmails.includes(email)) {
                await createRecipient({
                  data: {
                    alertId: currentRow.id,
                    email,
                  },
                });
              }
            }
          },
        },
      );
    } else {
      createAlert(
        {
          data: payload,
        },
        {
          onSuccess: async (createdAlert) => {
            // Create recipients for the new alert
            for (const email of data.recipientEmails) {
              await createRecipient({
                data: {
                  alertId: createdAlert.id,
                  email,
                },
              });
            }
          },
        },
      );
    }
  };

  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="text-start">
          <SheetTitle>{isUpdate ? "Editar" : "Criar"} Alerta</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Atualize as configurações do alerta de contrato."
              : "Configure um novo alerta para datas importantes do contrato."}{" "}
            Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 px-4 py-6">
          <ContractAlertForm
            defaultValues={
              currentRow
                ? {
                    contractId: currentRow.contractId,
                    eventType: currentRow.eventType,
                    eventName: currentRow.eventName,
                    eventDescription: currentRow.eventDescription ?? "",
                    eventDate: formatDateForInput(currentRow.eventDate),
                    eventTime: currentRow.eventTime ?? "",
                    recurrence: currentRow.recurrence,
                    advanceNoticeDays: currentRow.advanceNoticeDays ?? [
                      30, 15, 7, 1,
                    ],
                    recipientEmails:
                      currentRow.recipients?.map((r) => r.email) ?? [],
                    active: currentRow.active,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={isCreating || isUpdating}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
