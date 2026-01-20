import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { schema } from "@acme/zen-v3/zenstack/schema";

import type { Member } from "../data/schema";
import { SelectDropdown } from "~/components/select-dropdown";
import { profiles } from "../data/data";

const formSchema = z.object({
  profile: z.enum(["admin", "manager", "operator", "viewer"] as const, {
    message: "Perfil é obrigatório.",
  }),
});

type EditProfileForm = z.infer<typeof formSchema>;

type UsersEditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
};

export function UsersEditProfileDialog({
  open,
  onOpenChange,
  member,
}: UsersEditProfileDialogProps) {
  const queryClient = useQueryClient();
  const client = useClientQueries(schema);
  const updateMember = client.member.useUpdate();

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { profile: member.profile ?? "viewer" },
  });

  const onSubmit = async (values: EditProfileForm) => {
    try {
      await updateMember.mutateAsync({
        where: { id: member.id },
        data: { profile: values.profile },
      });

      await queryClient.invalidateQueries();

      toast.success("Perfil atualizado", {
        description: `O perfil de ${member.user.name} foi atualizado.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao atualizar perfil", {
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao atualizar o perfil.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize o perfil de acesso de {member.user.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="edit-profile-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil de Acesso</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Selecione um perfil"
                    items={profiles.map(({ label, value, description }) => ({
                      label: `${label} - ${description}`,
                      value,
                    }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="gap-y-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-profile-form"
            disabled={updateMember.isPending}
          >
            {updateMember.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
